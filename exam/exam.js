const $ = id => document.getElementById(id);
const LS = 'exam.last';
let T = { topic: '', questions: [], minutes: 10 };   // joriy test
let S = null;                                         // imtihon holati

const show = id => ['setup', 'ready', 'exam', 'result'].forEach(x => $(x).hidden = x !== id);
const msg = (t, info) => { $('msg').textContent = t; $('msg').className = 'msg' + (info ? ' info' : ''); };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clean = s => s.toLowerCase().replace(/[^a-z0-9ʻ'Ѐ-ӿ ]/g, '').trim();

// Variantlar tartibini aralashtirib, to'g'ri javob o'rnini yangilaydi
function prepare(qs) {
  return shuffle(qs).map(q => {
    const order = shuffle([0, 1, 2, 3]);
    return { q: q.q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct), explanation: q.explanation || '' };
  });
}

function fromBank(topic) {
  const key = Object.keys(BANK).find(k => clean(topic).includes(k));
  return key && BANK[key].map(([q, options, correct, explanation]) => ({ q, options, correct, explanation }));
}

async function generate() {
  const topic = $('topic').value.trim();
  if (!topic) return msg('Mavzuni kiriting');
  const count = Math.min(Math.max(+$('count').value || 10, 5), 40);
  $('gen').disabled = true; msg('Savollar tuzilmoqda…', true);
  try {
    const r = await fetch('/api/exam', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic, count }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Xato ' + r.status);
    setTest(d.topic, d.questions);
  } catch (e) {
    const b = fromBank(topic);
    if (b) setTest(topic, b.slice(0, count));
    else msg(`AI orqali tuzib bo'lmadi (${e.message}). Serverni ANTHROPIC_API_KEY bilan ishga tushiring yoki "O'z savollarimni kiritaman" bo'limidan foydalaning. Tayyor mavzular: ${Object.keys(BANK).join(', ')}.`);
  }
  $('gen').disabled = false;
}

function parsePaste(text) {
  const out = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const opts = [], q = [];
    let ans = -1;
    for (const l of lines) {
      let m;
      if ((m = /^([A-D])[).]\s*(.+)$/i.exec(l))) opts[m[1].toUpperCase().charCodeAt(0) - 65] = m[2];
      else if ((m = /^(?:javob|answer)\s*[:\-]\s*([A-D])/i.exec(l))) ans = m[1].toUpperCase().charCodeAt(0) - 65;
      else if (!opts.length) q.push(l);
    }
    if (q.length && opts.length === 4 && opts.every(Boolean) && ans >= 0) out.push({ q: q.join(' '), options: opts, correct: ans, explanation: '' });
  }
  return out;
}

function setTest(topic, questions) {
  T = { topic, questions, minutes: Math.max(1, +$('minutes').value || 10) };
  try { localStorage.setItem(LS, JSON.stringify(T)); } catch {}
  $('rTitle').textContent = `Mavzu: ${topic}`;
  $('rInfo').textContent = `${questions.length} ta savol · ${T.minutes} daqiqa`;
  show('ready');
}

function start() {
  const qs = prepare(T.questions);
  S = { qs, ans: Array(qs.length).fill(-1), flag: Array(qs.length).fill(false), cur: 0, end: Date.now() + T.minutes * 60000, done: false };
  show('exam'); $('timer').hidden = false;
  S.tick = setInterval(tick, 500); tick(); render();
}

function tick() {
  const left = Math.max(0, S.end - Date.now());
  const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
  $('timer').textContent = `⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  $('timer').classList.toggle('low', left < 60000);
  if (!left) finish();
}

function render() {
  const q = S.qs[S.cur];
  $('qnum').textContent = `Savol ${S.cur + 1} / ${S.qs.length}`;
  $('qtext').textContent = q.q;
  $('flag').textContent = S.flag[S.cur] ? '🚩 Belgi olib tashlash' : '🚩 Belgilash';
  $('opts').replaceChildren(...q.options.map((o, i) => {
    const b = document.createElement('button');
    b.className = 'opt' + (S.ans[S.cur] === i ? ' sel' : '');
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', S.ans[S.cur] === i);
    b.innerHTML = '<b></b><span></span>';
    b.firstChild.textContent = 'ABCD'[i]; b.lastChild.textContent = o;
    b.onclick = () => { S.ans[S.cur] = S.ans[S.cur] === i ? -1 : i; render(); };
    return b;
  }));
  $('grid').replaceChildren(...S.qs.map((_, i) => {
    const b = document.createElement('button'); b.textContent = i + 1;
    b.className = (S.ans[i] >= 0 ? 'a ' : '') + (S.flag[i] ? 'f ' : '') + (i === S.cur ? 'c' : '');
    b.onclick = () => { S.cur = i; render(); };
    return b;
  }));
  const n = S.ans.filter(a => a >= 0).length;
  $('prog').textContent = `Javob berilgan: ${n} / ${S.qs.length}`;
  $('prev').disabled = S.cur === 0;
  $('next').disabled = S.cur === S.qs.length - 1;
}

function confirmBox(text) {
  return new Promise(res => {
    $('dlgText').textContent = text; $('dlg').hidden = false;
    const close = v => { $('dlg').hidden = true; res(v); };
    $('dlgYes').onclick = () => close(true); $('dlgNo').onclick = () => close(false);
  });
}

async function tryFinish() {
  const left = S.ans.filter(a => a < 0).length;
  if (await confirmBox(left ? `${left} ta savolga javob berilmagan. Baribir yakunlaysizmi?` : 'Imtihonni yakunlaysizmi?')) finish();
}

function finish() {
  if (!S || S.done) return;
  S.done = true; clearInterval(S.tick); $('timer').hidden = true; $('dlg').hidden = true;
  const total = S.qs.length, ok = S.qs.filter((q, i) => S.ans[i] === q.correct).length;
  const pct = Math.round(ok / total * 100);
  $('pct').textContent = pct + '%';
  $('detail').textContent = `${total} savoldan ${ok} tasi to'g'ri · ${S.ans.filter(a => a < 0).length} ta javobsiz`;
  const g = pct >= 86 ? ['A\'lo (5)', '#1c9a57'] : pct >= 71 ? ['Yaxshi (4)', '#1f5fd6'] : pct >= 56 ? ['Qoniqarli (3)', '#e8a317'] : ['Qoniqarsiz (2)', '#d03a3a'];
  $('grade').textContent = g[0]; $('pct').style.color = $('grade').style.color = g[1];
  $('review').replaceChildren(...S.qs.map((q, i) => {
    const d = document.createElement('div'); d.className = 'rv' + (S.ans[i] === q.correct ? ' ok' : '');
    const p = (cls, t) => { const e = document.createElement('p'); if (cls) e.className = cls; e.textContent = t; d.append(e); };
    p('', `${i + 1}. ${q.q}`);
    p(S.ans[i] === q.correct ? 'y' : 'n', 'Sizning javobingiz: ' + (S.ans[i] < 0 ? 'javob berilmagan' : `${'ABCD'[S.ans[i]]}) ${q.options[S.ans[i]]}`));
    if (S.ans[i] !== q.correct) p('y', `To'g'ri javob: ${'ABCD'[q.correct]}) ${q.options[q.correct]}`);
    if (q.explanation) p('ex', q.explanation);
    return d;
  }));
  show('result');
}

$('gen').onclick = generate;
$('topic').onkeydown = e => e.key === 'Enter' && generate();
$('usePaste').onclick = () => {
  const qs = parsePaste($('paste').value);
  if (!qs.length) return msg("Savollar o'qilmadi. Formatni tekshiring (4 ta variant va «Javob: B»).");
  setTest($('topic').value.trim() || "O'z savollarim", qs);
};
$('start').onclick = start;
$('back').onclick = () => show('setup');
$('prev').onclick = () => { S.cur--; render(); };
$('next').onclick = () => { S.cur++; render(); };
$('flag').onclick = () => { S.flag[S.cur] = !S.flag[S.cur]; render(); };
$('finish').onclick = tryFinish;
$('again').onclick = () => show('setup');
$('retry').onclick = () => show('ready');
document.addEventListener('keydown', e => {
  if (!S || S.done || $('exam').hidden || $('dlg').hidden === false || e.target.tagName === 'INPUT') return;
  if ('1234'.includes(e.key) && e.key) { S.ans[S.cur] = +e.key - 1; render(); }
  else if (e.key === 'ArrowRight' && S.cur < S.qs.length - 1) { S.cur++; render(); }
  else if (e.key === 'ArrowLeft' && S.cur > 0) { S.cur--; render(); }
});
window.addEventListener('beforeunload', e => { if (S && !S.done) { e.preventDefault(); e.returnValue = ''; } });
