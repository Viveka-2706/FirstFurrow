// Loads the reference data (crops, soils, districts, symptom rules) into MongoDB.
//   npm run seed        → replaces those collections with the seed files
//   npm run seed:dry    → builds everything and writes seed/out/*.json (no database needed)
//
// SAFE TO RE-RUN: it never touches the `users` or `plans` collections.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSeedDocs } from './load.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = loadSeedDocs();
const counts = Object.entries(docs).map(([k, v]) => `${v.length} ${k}`).join(', ');
console.log(`Built: ${counts}`);

if (process.argv.includes('--dry-run')) {
  const out = path.join(here, 'out');
  fs.mkdirSync(out, { recursive: true });
  for (const [name, list] of Object.entries(docs)) fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(list, null, 2));
  console.log(`Dry run: wrote ${Object.keys(docs).length} files to ${out} — nothing sent to MongoDB.`);
  process.exit(0);
}

const { default: mongoose } = await import('mongoose');
const { Crop } = await import('../src/models/Crop.js');
const { Soil, Region, SymptomGroup, Symptom, Problem } = await import('../src/models/Reference.js');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const targets = [
  ['crops', Crop], ['soils', Soil], ['regions', Region],
  ['groups', SymptomGroup], ['symptoms', Symptom], ['problems', Problem],
];

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  for (const [name, Model] of targets) {
    await Model.deleteMany({});
    await Model.insertMany(docs[name]);
    console.log(`  ${name.padEnd(9)} ${await Model.countDocuments()} documents`);
  }
  console.log(`Seeded database "${mongoose.connection.name}".`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
