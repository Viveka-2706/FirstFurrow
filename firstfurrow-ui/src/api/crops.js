import { api } from './client';

export async function fetchRecommendations({ soil, season, budget, land, region }, signal) {
  const q = new URLSearchParams({ soil, season, budget, land: String(land), region: region ?? '' });
  return (await api(`/crops/recommend?${q}`, { auth: false, signal })).crops;
}
