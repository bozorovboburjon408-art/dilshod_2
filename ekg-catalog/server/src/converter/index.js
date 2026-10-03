// STEP/STP -> GLB conversion architecture.
//
// Browsers cannot render STEP (B-rep) directly. Uploading a STEP file creates a part_models row with
// conversion_status = 'pending'. A converter turns it into GLB and fills converted_url:
//
//   upload -> part_models(status=pending) -> enqueueConversion() -> external converter -> GLB in /files
//                                                                  -> part_models(status=ready, converted_url)
//
// The converter is pluggable via STEP_CONVERTER_CMD, a shell template with {input} and {output}, e.g.
//   STEP_CONVERTER_CMD='freecadcmd /opt/tools/step2glb.py {input} {output}'
//   STEP_CONVERTER_CMD='python3 /opt/tools/cadquery_step2glb.py {input} {output}'
//   STEP_CONVERTER_CMD='node /opt/tools/occt-import-js-convert.mjs {input} {output}'
// In production run it as a separate worker/queue (BullMQ, pg-boss) on the same contract.
// Without STEP_CONVERTER_CMD the row stays 'pending' and the UI shows a clear status.
import { spawn } from 'node:child_process';
import { basename, extname, join } from 'node:path';

const q = (s) => `'${s.replace(/'/g, `'\\''`)}'`;

export async function enqueueConversion(store, row, uploadsDir) {
  const cmd = process.env.STEP_CONVERTER_CMD;
  if (!cmd) {
    await store.upsert('part_models', { id: row.id, conversion_status: 'pending', conversion_message: 'Konverter sozlanmagan (STEP_CONVERTER_CMD). Faylni GLB ga o‘tkazib, GLB sifatida yuklang.' });
    return;
  }
  const input = join(uploadsDir, basename(row.file_url));
  const outName = `${basename(input, extname(input))}.glb`;
  const output = join(uploadsDir, outName);
  await store.upsert('part_models', { id: row.id, conversion_status: 'processing', conversion_message: null });
  const child = spawn('sh', ['-c', cmd.replace('{input}', q(input)).replace('{output}', q(output))], { stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d));
  child.on('close', async (code) => {
    if (code === 0) await store.upsert('part_models', { id: row.id, conversion_status: 'ready', converted_url: `/files/${outName}`, conversion_message: null });
    else await store.upsert('part_models', { id: row.id, conversion_status: 'failed', conversion_message: log.slice(-500) || `exit ${code}` });
  });
}
