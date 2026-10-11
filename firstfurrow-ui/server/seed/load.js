// Reads every seed file and returns documents ready to insert (or to hand to the in-memory repo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCrops } from './build-crops.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, 'data', f), 'utf8'));

// Mongo documents use `_id`; the API (and the in-memory repo) use `id`.
const toApi = ({ _id, ...rest }) => ({ id: _id, ...rest });

export function loadSeedDocs() {
  const reference = read('reference.json');
  const sym = read('symptoms.json');
  return {
    crops: buildCrops(read('crop_dataset.json'), read('rich_guides.json')),
    soils: reference.soils,
    regions: reference.regions,
    groups: sym.groups,
    symptoms: sym.symptoms,
    problems: sym.problems,
  };
}

export function loadSeedForMemory() {
  const d = loadSeedDocs();
  return Object.fromEntries(Object.entries(d).map(([k, docs]) => [k, docs.map(toApi)]));
}
