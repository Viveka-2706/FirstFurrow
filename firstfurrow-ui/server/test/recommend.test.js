import test from 'node:test';
import assert from 'node:assert/strict';
import { apiCrops } from './helpers.js';
import { recommend, SOILS, SEASON_KEYS, BUDGET_CAPS, growsInSeason } from '../src/recommend.js';

const ids = (r) => r.map((c) => c.id);

test('returns at most 3, best-first within soil-suited and unsuited groups, match is an integer 0-100', () => {
  const r = recommend(apiCrops, { soil: 'red', season: 'Kharif', budget: 'mid', land: 0.5 });
  assert.ok(r.length > 0 && r.length <= 3);
  for (const group of [r.filter((c) => c.suitableSoils.includes('red')), r.filter((c) => !c.suitableSoils.includes('red'))]) {
    for (let i = 1; i < group.length; i++) assert.ok(group[i - 1].match >= group[i].match, 'scores must not increase down the list');
  }
  for (const c of r) assert.ok(Number.isInteger(c.match) && c.match >= 0 && c.match <= 100);
});

test('season is a hard filter (radish is Rabi-only; groundnut Kharif-only)', () => {
  const kharif = recommend(apiCrops, { soil: 'red', season: 'Kharif', budget: 'flex', land: 0.5 }, 99);
  assert.ok(!ids(kharif).includes('radish'));
  const rabi = recommend(apiCrops, { soil: 'red', season: 'Rabi', budget: 'flex', land: 0.5 }, 99);
  assert.ok(!ids(rabi).includes('groundnut'));
  assert.ok(ids(kharif).includes('moringa') && ids(rabi).includes('moringa'), 'year-round crops fit any season');
});

test('budget is a hard filter: nothing returned that the farmer cannot afford', () => {
  for (const land of [0.25, 0.5, 1, 2]) {
    for (const budget of ['low', 'mid']) {
      for (const season of SEASON_KEYS) {
        const r = recommend(apiCrops, { soil: 'red', season, budget, land }, 99);
        for (const c of r) {
          const cheapest = c.perUnit ? c.investmentRange.min : c.investmentRange.min * land;
          assert.ok(cheapest <= BUDGET_CAPS[budget], `${c.id} costs at least ₹${cheapest} but budget is ${budget}`);
        }
      }
    }
  }
});

test('onion (₹30k+/acre) is excluded for a low budget on 1 acre, allowed on a tiny plot', () => {
  assert.ok(!ids(recommend(apiCrops, { soil: 'red', season: 'Rabi', budget: 'low', land: 1 }, 99)).includes('onion'));
  assert.ok(ids(recommend(apiCrops, { soil: 'red', season: 'Rabi', budget: 'low', land: 0.2 }, 99)).includes('onion'));
});

test('mushroom cost is per setup: it stays eligible on 5 acres at a mid budget while per-acre crops do not', () => {
  const r = recommend(apiCrops, { soil: 'red', season: 'Kharif', budget: 'mid', land: 5 }, 99);
  assert.ok(ids(r).includes('oyster_mushroom'), 'flat ₹25-35k setup fits a ₹45k budget regardless of land');
  assert.ok(!ids(r).includes('tomato'), 'tomato at ₹25k+/acre × 5 acres does not');
  // ...but its ₹25k+ setup cost is still above a ₹20k budget
  assert.ok(!ids(recommend(apiCrops, { soil: 'red', season: 'Kharif', budget: 'low', land: 0.1 }, 99)).includes('oyster_mushroom'));
});

test('soil-suited crops come before unsuited ones', () => {
  const r = recommend(apiCrops, { soil: 'sandy_coastal', season: 'Zaid', budget: 'mid', land: 0.5 }, 99);
  let seenUnsuited = false;
  for (const c of r) {
    const suited = c.suitableSoils.includes('sandy_coastal');
    if (!suited) seenUnsuited = true;
    assert.ok(!(seenUnsuited && suited), 'a suited crop appeared after an unsuited one');
  }
});

test('a better fit scores higher: right soil + good land fit beats wrong soil', () => {
  const r = recommend(apiCrops, { soil: 'red', season: 'Kharif', budget: 'flex', land: 0.5 }, 99);
  const top = r[0];
  assert.ok(top.suitableSoils.includes('red'));
  const unsuited = r.find((c) => !c.suitableSoils.includes('red'));
  if (unsuited) assert.ok(top.match > unsuited.match);
});

test('every soil × season × budget × land combination yields a sensible answer without crashing', () => {
  let empty = 0;
  for (const soil of SOILS) for (const season of SEASON_KEYS) for (const budget of Object.keys(BUDGET_CAPS)) for (const land of [0.05, 0.25, 0.5, 1, 2.5]) {
    const r = recommend(apiCrops, { soil, season, budget, land });
    assert.ok(r.length <= 3);
    assert.equal(new Set(ids(r)).size, r.length, 'no duplicates');
    for (const c of r) assert.ok(growsInSeason(c, season));
    if (r.length === 0) empty++;
  }
  assert.equal(empty, 0, 'no combination should leave the farmer with zero crops');
});
