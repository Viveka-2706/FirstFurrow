import test from 'node:test';
import assert from 'node:assert/strict';
import { docs, dataset } from './helpers.js';
import { SOILS } from '../src/recommend.js';

test('builds one document per dataset crop, with unique slug ids', () => {
  assert.equal(docs.length, dataset.crops.length);
  assert.equal(new Set(docs.map((d) => d._id)).size, docs.length);
});

test('numbers always come from the dataset', () => {
  for (const d of dataset.crops) {
    const doc = docs.find((x) => x.datasetId === d.id);
    assert.equal(doc.investmentRange.min, d.investmentPerAcreINR.min);
    assert.equal(doc.investmentRange.max, d.investmentPerAcreINR.max);
    assert.equal(doc.returnMin, d.expectedReturnPerAcreINR.min);
    assert.equal(doc.returnMax, d.expectedReturnPerAcreINR.max);
    assert.equal(doc.durationDays, d.durationDays);
    assert.equal(doc.investment, Math.round((d.investmentPerAcreINR.min + d.investmentPerAcreINR.max) / 2));
  }
});

test('every crop has a Tamil overlay that lines up with the English guide', () => {
  for (const d of docs) {
    assert.ok(d.ta.name && d.ta.localName && d.ta.tagline && d.ta.blurb, `${d._id}: Tamil identity text`);
    assert.equal(d.ta.guide.length, d.guide.length, `${d._id}: stage count`);
    d.guide.forEach((s, i) => {
      const t = d.ta.guide[i];
      assert.ok(t.stage && t.dayRange && t.whatToDo, `${d._id} stage ${i}: Tamil text`);
      assert.equal(t.costItems.length, s.costItems.length, `${d._id} stage ${i}: cost item count`);
      assert.match(t.whatToDo + t.stage, /[\u0B80-\u0BFF]/, `${d._id} stage ${i}: actually Tamil`);
    });
  }
});

test('soils are valid and every crop suits at least one', () => {
  for (const d of docs) {
    assert.ok(d.suitableSoils.length > 0, d._id);
    for (const s of d.suitableSoils) assert.ok(SOILS.includes(s), `${d._id}: unknown soil ${s}`);
  }
});

test('the three hand-written guides are kept in full', () => {
  for (const slug of ['okra', 'spinach', 'marigold']) {
    const d = docs.find((x) => x._id === slug);
    assert.equal(d.guideLevel, 'full');
    assert.ok(d.guide.every((s) => s.why && s.beginnerTip && s.warningSign && s.costItems.length), `${slug}: full detail`);
    assert.ok(!('match' in d), 'match is computed per request, never stored');
  }
  assert.equal(docs.filter((d) => d.guideLevel === 'basic').length, 15);
});

test('every crop — not just the 3 hand-written ones — has complete stage detail in both languages', () => {
  for (const d of docs) {
    d.guide.forEach((s, i) => {
      assert.ok(s.why, `${d._id} stage ${i} (en): why is blank`);
      assert.ok(s.beginnerTip, `${d._id} stage ${i} (en): beginnerTip is blank`);
      assert.ok(s.warningSign, `${d._id} stage ${i} (en): warningSign is blank`);
      assert.ok(s.costItems.length, `${d._id} stage ${i} (en): no costItems`);
      for (const ci of s.costItems) assert.ok(ci.item && ci.cost, `${d._id} stage ${i} (en): incomplete cost item`);
    });
    d.ta.guide.forEach((s, i) => {
      assert.ok(s.why, `${d._id} stage ${i} (ta): why is blank`);
      assert.ok(s.beginnerTip, `${d._id} stage ${i} (ta): beginnerTip is blank`);
      assert.ok(s.warningSign, `${d._id} stage ${i} (ta): warningSign is blank`);
      assert.ok(s.costItems.length, `${d._id} stage ${i} (ta): no costItems`);
    });
    for (const w of [d.water, d.ta.water]) {
      assert.ok(w.method, `${d._id}: water.method is blank`);
      assert.ok(w.criticalStages, `${d._id}: water.criticalStages is blank`);
      assert.ok(w.warning, `${d._id}: water.warning is blank`);
    }
  }
});

test('repeated task types are numbered so stage names stay unique', () => {
  for (const d of docs) {
    const names = d.guide.map((s) => s.stage);
    assert.equal(new Set(names).size, names.length, `${d._id}: duplicate stage names`);
  }
  const tomato = docs.find((d) => d._id === 'tomato');
  assert.deepEqual(tomato.guide.filter((s) => s.stageId === 'Fertilizing').map((s) => s.stage), ['Fertilizing 1', 'Fertilizing 2']);
});

test('last stage reads "Day N onward"; mushroom is priced per setup', () => {
  const tomato = docs.find((d) => d._id === 'tomato');
  assert.equal(tomato.guide.at(-1).dayRange, 'Day 90 onward');
  assert.equal(tomato.ta.guide.at(-1).dayRange, 'நாள் 90 முதல்');
  assert.equal(docs.find((d) => d._id === 'oyster_mushroom').perUnit, true);
  assert.equal(docs.filter((d) => d.perUnit).length, 1);
});
