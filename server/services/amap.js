const AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";
const AMAP_POI_URL = "https://restapi.amap.com/v3/place/text";
const AMAP_DRIVING_URL = "https://restapi.amap.com/v3/direction/driving";
const AMAP_STATIC_MAP_URL = "https://restapi.amap.com/v3/staticmap";
const AMAP_URI_MARKER_URL = "https://uri.amap.com/marker";

const requestTimeoutMs = 7000;

export async function buildAmapContext(input) {
  const apiKey = process.env.AMAP_API_KEY || process.env.GAODE_API_KEY || "";
  const dataSources = ["内置城市样例库", "启发式路线优化"];
  const warnings = [];

  if (!apiKey) {
    warnings.push("未配置 AMAP_API_KEY，当前使用内置样例与估算数据。");
    return {
      dataMode: "sample",
      dataSources,
      warnings,
      cityProfiles: {}
    };
  }

  const cities = [...new Set([input.origin, ...input.destinations])].filter(Boolean);
  const geocodeEntries = await Promise.all(cities.map(async (city) => {
    try {
      const profile = await geocodeCity(city, apiKey);
      return [city, profile];
    } catch (error) {
      warnings.push(`${city} 地理编码失败，已回退到内置或估算坐标。`);
      return [city, null];
    }
  }));
  const cityProfiles = Object.fromEntries(geocodeEntries.filter(([, profile]) => profile));

  const poiEntries = await Promise.all(input.destinations.map(async (city) => {
    try {
      const pois = await searchCityPois(city, input.preferences || {}, apiKey);
      if (!pois.length) return [city, null];
      return [city, {
        poiAttractions: pois,
        attractions: pois.map((poi) => poi.name),
        stayArea: deriveStayArea(city, pois)
      }];
    } catch (error) {
      warnings.push(`${city} POI 搜索失败，已回退到内置景点。`);
      return [city, null];
    }
  }));

  const hotelEntries = input.hotelName
    ? await Promise.all(input.destinations.map(async (city) => {
      try {
        const hotel = await searchHotel(city, input.hotelName, apiKey);
        return [city, hotel];
      } catch {
        warnings.push(`${city} 酒店检索失败，已跳过酒店首末段交通估算。`);
        return [city, null];
      }
    }))
    : [];

  for (const [city, profile] of poiEntries) {
    if (!profile) continue;
    cityProfiles[city] = {
      ...(cityProfiles[city] || {}),
      ...profile
    };
  }

  for (const [city, hotel] of hotelEntries) {
    if (!hotel) continue;
    cityProfiles[city] = {
      ...(cityProfiles[city] || {}),
      hotel
    };
  }

  const legOverrides = await buildLegOverrides(cities, cityProfiles, apiKey, warnings);

  return {
    dataMode: "amap",
    dataSources: [...dataSources, "高德地图地理编码", "高德 POI 搜索", "高德路线估算", "高德静态地图"],
    warnings,
    cityProfiles,
    legOverrides
  };
}

async function geocodeCity(city, apiKey) {
  const params = new URLSearchParams({
    key: apiKey,
    address: city,
    city
  });
  const payload = await fetchAmapJson(`${AMAP_GEOCODE_URL}?${params.toString()}`);
  const geocode = payload.geocodes?.[0];
  if (payload.status !== "1" || !geocode?.location) {
    throw new Error(payload.info || "Amap geocode failed");
  }

  const [lng, lat] = geocode.location.split(",").map(Number);
  return {
    region: geocode.province || geocode.city || "实时地理编码",
    coordinates: [lng, lat],
    stayArea: "核心商圈 / 交通枢纽周边"
  };
}

async function searchCityPois(city, preferences, apiKey) {
  const keywords = [
    `${city} 必游景点`,
    `${city} 旅游景点`,
    `${city} 博物馆`,
    `${city} 城墙 古城`,
    ...(preferences.food ? [`${city} 老字号 美食`] : []),
    ...(preferences.nature ? [`${city} 公园 景区`] : []),
    ...getRegionalPoiKeywords(city, preferences)
  ].slice(0, 11);
  const seen = new Set();
  const results = [];
  const cityLimited = shouldUseCityLimit(city);

  for (const keyword of keywords) {
    const params = new URLSearchParams({
      key: apiKey,
      keywords: keyword,
      city,
      citylimit: cityLimited ? "true" : "false",
      offset: "15",
      page: "1",
      extensions: "all"
    });
    const payload = await fetchAmapJson(`${AMAP_POI_URL}?${params.toString()}`);
    if (payload.status !== "1") continue;

    for (const poi of payload.pois || []) {
      if (!isUsefulPoi(poi) || seen.has(poi.name)) continue;
      const [lng, lat] = poi.location.split(",").map(Number);
      seen.add(poi.name);
      const areaLabel = formatPoiAreaLabel(poi, city);
      results.push({
        title: poi.name,
        name: poi.name,
        type: normalizePoiType(poi.type),
        address: normalizePoiAddress(poi),
        source: "高德POI",
        coordinates: [lng, lat],
        url: buildPoiMarkerUrl(poi.name, [lng, lat]),
        imageUrl: normalizePoiPhoto(poi),
        cityName: normalizeAmapText(poi.cityname),
        adName: normalizeAmapText(poi.adname),
        areaLabel,
        areaKey: formatPoiAreaKey(poi, city, cityLimited, [lng, lat]),
        xiaohongshuUrl: buildXiaohongshuSearchUrl(`${city} ${poi.name} 攻略`),
        rating: poi.biz_ext?.rating || "",
        cost: poi.biz_ext?.cost || ""
      });
    }
  }

  return rankPois(results, preferences).slice(0, 30);
}

async function searchHotel(city, hotelName, apiKey) {
  const params = new URLSearchParams({
    key: apiKey,
    keywords: `${city} ${hotelName}`,
    city,
    citylimit: shouldUseCityLimit(city) ? "true" : "false",
    offset: "8",
    page: "1",
    extensions: "all"
  });
  const payload = await fetchAmapJson(`${AMAP_POI_URL}?${params.toString()}`);
  if (payload.status !== "1") return null;

  const candidates = (payload.pois || []).filter((poi) => String(poi.location || "").includes(","));
  const match = candidates.find(isHotelLikePoi) || candidates[0];
  if (!match) return null;

  const [lng, lat] = match.location.split(",").map(Number);
  return {
    name: match.name,
    address: normalizePoiAddress(match),
    source: isHotelLikePoi(match) ? "高德酒店搜索" : "高德地点搜索",
    coordinates: [lng, lat],
    url: buildPoiMarkerUrl(match.name, [lng, lat]),
    imageUrl: normalizePoiPhoto(match),
    cityName: normalizeAmapText(match.cityname),
    adName: normalizeAmapText(match.adname),
    areaLabel: formatPoiAreaLabel(match, city),
    xiaohongshuUrl: buildXiaohongshuSearchUrl(`${match.name} 入住 交通 攻略`)
  };
}

async function buildLegOverrides(cities, cityProfiles, apiKey, warnings) {
  const overrides = {};

  for (let fromIndex = 0; fromIndex < cities.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < cities.length; toIndex += 1) {
      const from = cities[fromIndex];
      const to = cities[toIndex];
      const fromProfile = cityProfiles[from];
      const toProfile = cityProfiles[to];
      if (!fromProfile?.coordinates || !toProfile?.coordinates) continue;

      try {
        const leg = await getDrivingLeg(from, to, fromProfile.coordinates, toProfile.coordinates, apiKey);
        overrides[`${from}|${to}`] = leg;
        overrides[`${to}|${from}`] = {
          ...leg,
          from: to,
          to: from
        };
      } catch {
        warnings.push(`${from} 到 ${to} 路线估算失败，已回退到距离估算。`);
      }
    }
  }

  return overrides;
}

async function getDrivingLeg(from, to, origin, destination, apiKey) {
  const params = new URLSearchParams({
    key: apiKey,
    origin: origin.join(","),
    destination: destination.join(","),
    strategy: "10",
    extensions: "base"
  });
  const payload = await fetchAmapJson(`${AMAP_DRIVING_URL}?${params.toString()}`);
  const path = payload.route?.paths?.[0];
  if (payload.status !== "1" || !path) {
    throw new Error(payload.info || "Amap driving failed");
  }

  const distanceKm = Number(path.distance || 0) / 1000;
  const drivingHours = Number(path.duration || 0) / 3600;
  const hours = Math.max(0.8, drivingHours);

  return {
    from,
    to,
    mode: "高德驾车路线估算",
    hours: Number(hours.toFixed(1)),
    cost: estimateTransportCost(distanceKm),
    comfort: distanceKm > 900 ? 5 : distanceKm > 260 ? 6 : 8,
    distanceKm: Number(distanceKm.toFixed(1)),
    source: "高德路线"
  };
}

function estimateTransportCost(distanceKm) {
  if (!distanceKm) return 80;
  if (distanceKm > 900) return Math.round(distanceKm * 0.72 + 260);
  if (distanceKm > 260) return Math.round(distanceKm * 0.48 + 120);
  return Math.round(distanceKm * 0.42 + 35);
}

export function buildStaticMapUrl(points, apiKey, size = "1024*520") {
  const safePoints = points
    .filter((point) => Array.isArray(point) && point.length === 2)
    .map(([lng, lat]) => `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`);

  if (!safePoints.length || !apiKey) return "";

  const params = new URLSearchParams({
    key: apiKey,
    size,
    scale: "2",
    zoom: safePoints.length > 2 ? "5" : "4"
  });
  params.set("markers", safePoints.map((point, index) => `mid,0x253B59,${index + 1}:${point}`).join("|"));
  params.set("paths", `8,0xF06F5F,1,,:${safePoints.join(";")}`);

  return `${AMAP_STATIC_MAP_URL}?${params.toString()}`;
}

export function buildMarkerMapUrl(points, names = []) {
  const safeMarkers = points
    .filter((point) => Array.isArray(point) && point.length === 2)
    .slice(0, 10)
    .map(([lng, lat], index) => {
      const name = names[index] || `第 ${index + 1} 站`;
      return `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)},${name}`;
    });

  if (!safeMarkers.length) return "";

  const params = new URLSearchParams({
    markers: safeMarkers.join("|"),
    coordinate: "gaode",
    callnative: "0",
    src: "tripwise-planner"
  });

  return `${AMAP_URI_MARKER_URL}?${params.toString()}`;
}

function buildPoiMarkerUrl(name, coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return "";

  const params = new URLSearchParams({
    position: `${coordinates[0]},${coordinates[1]}`,
    name,
    coordinate: "gaode",
    callnative: "0",
    src: "tripwise-planner"
  });

  return `${AMAP_URI_MARKER_URL}?${params.toString()}`;
}

async function fetchAmapJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Amap HTTP ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizePoiType(type) {
  return String(type || "").split(";").slice(0, 2).join(" / ") || "地点";
}

function normalizePoiAddress(poi) {
  if (Array.isArray(poi.address)) return poi.address.join("");
  return String(poi.address || poi.adname || "").replace("[]", "");
}

function normalizeAmapText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("");
  return String(value || "").replace("[]", "").trim();
}

function normalizePoiPhoto(poi) {
  const photo = Array.isArray(poi.photos) ? poi.photos.find((item) => item.url) : null;
  return photo?.url || "";
}

function isUsefulPoi(poi) {
  const name = String(poi.name || "");
  const type = String(poi.type || "");
  const location = String(poi.location || "");

  if (!name || !location.includes(",")) return false;
  if (/售票|票务|入口|出口|停车场|卫生间|游客中心|服务中心|派出所|管理处|售卖|便利店/.test(name)) return false;
  if (/公司|住宅|小区|写字楼|政府机构|停车场|生活服务/.test(type)) return false;

  return true;
}

function isHotelLikePoi(poi) {
  const text = `${poi.name || ""}${poi.type || ""}${normalizePoiAddress(poi)}`;
  return /酒店|宾馆|旅馆|客栈|民宿|住宿|度假|公寓|招待所|饭店/.test(text);
}

function rankPois(pois, preferences) {
  return [...pois].sort((a, b) => {
    const categoryDelta = poiCategoryRank(a) - poiCategoryRank(b);
    if (categoryDelta !== 0) return categoryDelta;
    return scorePoi(b, preferences) - scorePoi(a, preferences);
  });
}

function scorePoi(poi, preferences) {
  const nameType = `${poi.name}${poi.type}`;
  const address = String(poi.address || "");
  const text = `${nameType}${address}`;
  let score = 0;

  if (/风景名胜|旅游景点|名胜古迹|博物馆|纪念馆|寺庙|教堂|公园|广场|文化场馆/.test(nameType)) score += 50;
  if (/城墙|古城|钟楼|鼓楼|大雁塔|小雁塔|兵马俑|历史博物馆|大唐|华清|碑林|回民街/.test(nameType)) score += 28;
  if (/城墙|古城|钟楼|鼓楼|大雁塔|小雁塔|兵马俑|历史博物馆|大唐|华清|碑林|回民街/.test(address)) score += 6;
  if (/购物|商圈|步行街|美食|餐饮|小吃|老字号/.test(nameType)) score += preferences.food ? 18 : 4;
  if (/公园|山|湖|河|湿地|森林|海|湾/.test(nameType)) score += preferences.nature ? 18 : 4;
  if (poi.rating && Number(poi.rating) > 0) score += Math.min(10, Number(poi.rating) * 2);
  if (/售票|票务|入口|出口|停车场/.test(text)) score -= 80;

  return score;
}

function poiCategoryRank(poi) {
  const nameType = `${poi.name}${poi.type}`;
  if (/风景名胜|旅游景点|名胜古迹|博物馆|纪念馆|寺庙|教堂|公园|广场|文化场馆/.test(nameType)) return 0;
  if (/餐饮|美食|小吃|中餐厅|老字号/.test(nameType)) return 1;
  return 2;
}

function deriveStayArea(city, pois) {
  const areaLabel = mostCommonAreaLabel(pois.filter((poi) => !poi.type.includes("餐饮")));
  if (areaLabel && areaLabel !== city) {
    return `${areaLabel}住宿圈`;
  }

  const names = pois
    .filter((poi) => !poi.type.includes("餐饮"))
    .slice(0, 2)
    .map((poi) => poi.name.replace(city, "").trim())
    .filter(Boolean);

  if (names.length) {
    return `${names.join(" / ")} 周边`;
  }

  return `${city}核心景点 / 交通枢纽周边`;
}

function mostCommonAreaLabel(pois) {
  const counts = new Map();
  for (const poi of pois) {
    if (!poi.areaLabel) continue;
    counts.set(poi.areaLabel, (counts.get(poi.areaLabel) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function formatPoiAreaLabel(poi, queryCity) {
  const cityName = normalizeAmapText(poi.cityname);
  const adName = normalizeAmapText(poi.adname);
  const province = normalizeAmapText(poi.pname);

  if (cityName && adName && cityName !== adName) return `${cityName}${adName}`;
  if (adName && adName !== queryCity) return adName;
  if (cityName && cityName !== queryCity) return cityName;
  if (province && province !== queryCity) return province;
  return "";
}

function formatPoiAreaKey(poi, queryCity, cityLimited, coordinates) {
  const cityName = normalizeAmapText(poi.cityname);
  const areaLabel = formatPoiAreaLabel(poi, queryCity);
  if (!cityLimited && cityName && cityName !== queryCity) return cityName;
  return areaLabel || coordinateAreaKey(coordinates);
}

function coordinateAreaKey(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return "";
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return "";
  return `${Math.round(lng * 2) / 2},${Math.round(lat * 2) / 2}`;
}

function buildXiaohongshuSearchUrl(query) {
  const keyword = String(query || "").trim();
  if (!keyword) return "";
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
}

function shouldUseCityLimit(city) {
  return !/新疆|西藏|内蒙古|青海|甘肃|四川|云南|贵州|广西|广东省|浙江省|江苏省|福建省|海南|省|自治区/.test(city);
}

function getRegionalPoiKeywords(city, preferences) {
  if (/新疆/.test(city)) {
    return [
      "乌鲁木齐 必游景点",
      "喀什 必游景点",
      "伊犁 必游景点",
      "吐鲁番 必游景点",
      ...(preferences.nature ? ["赛里木湖 景区", "喀纳斯 景区"] : [])
    ];
  }
  return [];
}
