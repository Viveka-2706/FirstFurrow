// Runs the SAME contract against a real MongoDB. Skipped unless you point it at one:
//   TEST_MONGODB_URI="mongodb://127.0.0.1:27017" npm run test:db
// It creates a throw-away database (ff_test_<timestamp>) and drops it afterwards — your real data is never touched.
import test from 'node:test';
import { defineRepoContract } from './repo.contract.js';

const uri = process.env.TEST_MONGODB_URI;

if (!uri) {
  test('data layer contract — MongoDB', { skip: 'set TEST_MONGODB_URI to run against a real MongoDB (see README)' }, () => {});
} else {
  const { default: mongoose } = await import('mongoose');
  const { loadSeedDocs } = await import('../seed/load.js');
  const { createMongoRepo } = await import('../src/repo/mongo.js');
  const { Crop } = await import('../src/models/Crop.js');
  const { User } = await import('../src/models/User.js');
  const { Plan } = await import('../src/models/Plan.js');
  const { PasswordReset } = await import('../src/models/PasswordReset.js');
  const { Soil, Region, SymptomGroup, Symptom, Problem } = await import('../src/models/Reference.js');

  defineRepoContract('data layer contract — MongoDB', async () => {
    await mongoose.connect(uri, { dbName: `ff_test_${Date.now()}`, serverSelectionTimeoutMS: 10000 });
    const docs = loadSeedDocs();
    for (const [name, Model] of [['crops', Crop], ['soils', Soil], ['regions', Region], ['groups', SymptomGroup], ['symptoms', Symptom], ['problems', Problem]]) {
      await Model.insertMany(docs[name]);
    }
    await Promise.all([User.init(), Plan.init(), PasswordReset.init()]); // builds the unique-email index the duplicate test relies on
    return {
      repo: createMongoRepo(),
      teardown: async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); },
    };
  });
}
