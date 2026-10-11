import { defineRepoContract } from './repo.contract.js';
import { createMemoryRepo } from '../src/repo/memory.js';
import { seed } from './helpers.js';

defineRepoContract('data layer contract — in-memory', async () => ({ repo: createMemoryRepo(seed), teardown: async () => {} }));
