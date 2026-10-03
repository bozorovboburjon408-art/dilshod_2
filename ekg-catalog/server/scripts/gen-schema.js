import { writeFileSync } from 'node:fs';
import { createSql } from '../src/schema.js';
const target = new URL('../../db/schema.sql', import.meta.url);
writeFileSync(target, createSql());
console.log('wrote', target.pathname);
