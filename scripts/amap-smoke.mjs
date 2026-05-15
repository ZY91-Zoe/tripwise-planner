import { loadLocalEnv } from "../server/services/env.js";
import { buildAmapContext, buildStaticMapUrl } from "../server/services/amap.js";

loadLocalEnv(process.cwd());

const apiKey = process.env.AMAP_API_KEY || process.env.GAODE_API_KEY || "";

if (!apiKey) {
  console.log(JSON.stringify({
    ok: false,
    configured: false,
    message: "AMAP_API_KEY is not configured."
  }, null, 2));
  process.exit(0);
}

const input = {
  origin: "杭州",
  destinations: ["西安"],
  preferences: {
    food: true,
    culture: true,
    nature: false
  }
};

const context = await buildAmapContext(input);
const pois = context.cityProfiles["西安"]?.poiAttractions || [];
const points = ["杭州", "西安", "杭州"]
  .map((city) => context.cityProfiles[city]?.coordinates)
  .filter(Boolean);
const mapUrl = buildStaticMapUrl(points, apiKey, "600*300");
const mapResponse = mapUrl ? await fetch(mapUrl) : null;
const mapBytes = mapResponse ? Buffer.from(await mapResponse.arrayBuffer()).length : 0;

console.log(JSON.stringify({
  ok: pois.length > 0 && mapResponse?.ok,
  configured: true,
  dataMode: context.dataMode,
  poiCount: pois.length,
  firstPois: pois.slice(0, 5).map((poi) => ({
    name: poi.name,
    type: poi.type,
    address: poi.address
  })),
  map: {
    status: mapResponse?.status || null,
    contentType: mapResponse?.headers.get("content-type") || null,
    bytes: mapBytes
  },
  warnings: context.warnings
}, null, 2));
