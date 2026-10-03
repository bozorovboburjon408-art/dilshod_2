import pg from 'pg';
import { TABLES, TABLE_NAMES, cleanRow, createSql, colsOf, typeOf } from '../schema.js';

pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))); // NUMERIC -> number

export function createPgStore(url, seed) {
  const pool = new pg.Pool({ connectionString: url });
  const bind = (t, col, v) => (v !== null && typeOf(t, col) === 'json' ? JSON.stringify(v) : v);
  return {
    kind: 'postgres',
    async init() {
      await pool.query(createSql());
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM machines');
      if (rows[0].n === 0) {
        for (const t of TABLE_NAMES) for (const r of seed[t] || []) await this.upsert(t, r);
      }
    },
    async list(t) { return (await pool.query(`SELECT * FROM ${t}`)).rows; },
    async upsert(t, row) {
      const r = cleanRow(t, row);
      const cols = Object.keys(r);
      const vals = cols.map((c) => bind(t, c, r[c]));
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      const set = cols.filter((c) => c !== 'id').map((c) => `${c}=EXCLUDED.${c}`).join(',');
      const sql = `INSERT INTO ${t} (${cols.join(',')}) VALUES (${ph}) ON CONFLICT (id) DO UPDATE SET ${set || 'id=EXCLUDED.id'} RETURNING *`;
      return (await pool.query(sql, vals)).rows[0];
    },
    async remove(t, id) { await pool.query(`DELETE FROM ${t} WHERE id=$1`, [id]); },
  };
}
