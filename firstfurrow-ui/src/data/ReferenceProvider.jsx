import { useEffect, useMemo, useState } from 'react';
import { ReferenceContext } from './useReference';
import { fetchReference } from '../api/reference';
import { soilTypes as bundledSoils, regions as bundledRegions, soilRegionMap, regionCoordinates, crops as bundledCrops } from './dummyData';
import { soilsTa, regionsTa, cropsTa } from '../i18n/content.ta';

// The soils, districts and crop names live in MongoDB. This copy bundled with the app is only what is
// shown the instant the page opens (and if the server is unreachable); as soon as the database answers,
// its values replace these — so the database is the source of truth.
const BUNDLED = {
  soils: bundledSoils.map((s) => ({ ...s, regions: soilRegionMap[s.id] ?? [], ta: soilsTa[s.id] })),
  regions: bundledRegions.map((r) => ({ id: r, name: r, ...regionCoordinates[r], ta: { name: regionsTa[r] } })),
  crops: bundledCrops.map((c) => ({ id: c.id, name: c.name, localName: c.localName, ta: { name: cropsTa[c.id]?.name, localName: cropsTa[c.id]?.localName } })),
};

export function ReferenceProvider({ children }) {
  const [data, setData] = useState(BUNDLED);

  useEffect(() => {
    const controller = new AbortController();
    fetchReference(controller.signal)
      .then((r) => { if (r?.soils?.length && r?.regions?.length) setData({ soils: r.soils, regions: r.regions, crops: r.crops ?? BUNDLED.crops }); })
      .catch(() => { /* keep the bundled copy */ });
    return () => controller.abort();
  }, []);

  const value = useMemo(() => ({
    // the same shapes the components already used, now derived from the database records
    soilTypes: data.soils.map(({ id, name, where, feel }) => ({ id, name, where, feel })),
    regions: data.regions.map((r) => r.id),
    soilRegionMap: Object.fromEntries(data.soils.map((s) => [s.id, s.regions])),
    regionCoordinates: Object.fromEntries(data.regions.map((r) => [r.id, { lat: r.lat, lon: r.lon }])),
    soilsTa: Object.fromEntries(data.soils.map((s) => [s.id, s.ta])),
    regionsTa: Object.fromEntries(data.regions.map((r) => [r.id, r.ta?.name])),
    cropNames: data.crops,
  }), [data]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}
