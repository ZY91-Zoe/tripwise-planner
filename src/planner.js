export const cityProfiles = {
  "杭州": {
    region: "华东",
    stayArea: "武林广场 / 钱江新城",
    dailyHotel: 460,
    dailyFood: 180,
    coordinates: [120.1551, 30.2741],
    attractions: ["西湖风景名胜区", "灵隐寺", "雷峰塔景区", "西溪国家湿地公园", "河坊街", "京杭大运河杭州景区", "龙井茶村"]
  },
  "广州": {
    region: "广府核心",
    stayArea: "珠江新城 / 北京路",
    dailyHotel: 520,
    dailyFood: 230,
    coordinates: [113.2644, 23.1291],
    attractions: ["陈家祠", "永庆坊", "珠江夜游", "早茶体验", "广东省博物馆"]
  },
  "深圳": {
    region: "湾区东岸",
    stayArea: "福田中心区 / 南山科技园",
    dailyHotel: 560,
    dailyFood: 220,
    coordinates: [114.0579, 22.5431],
    attractions: ["深圳湾公园", "华侨城创意园", "莲花山公园", "海上世界", "南头古城"]
  },
  "茂名": {
    region: "粤西滨海",
    stayArea: "电白 / 水东湾",
    dailyHotel: 330,
    dailyFood: 170,
    coordinates: [110.9255, 21.6629],
    attractions: ["中国第一滩", "晏镜岭", "露天矿生态公园", "水东鸭粥", "浪漫海岸"]
  },
  "澳门": {
    region: "特别行政区",
    stayArea: "氹仔 / 澳门半岛",
    dailyHotel: 760,
    dailyFood: 260,
    coordinates: [113.5439, 22.1987],
    attractions: ["大三巴牌坊", "议事亭前地", "官也街", "路环老街", "澳门塔"]
  },
  "佛山": {
    region: "广佛都市圈",
    stayArea: "祖庙 / 千灯湖",
    dailyHotel: 360,
    dailyFood: 190,
    coordinates: [113.1214, 23.0215],
    attractions: ["祖庙", "岭南天地", "清晖园", "顺德美食", "逢简水乡"]
  },
  "珠海": {
    region: "湾区西岸",
    stayArea: "拱北 / 情侣路",
    dailyHotel: 450,
    dailyFood: 200,
    coordinates: [113.5767, 22.2707],
    attractions: ["情侣路", "日月贝", "圆明新园", "横琴长隆", "拱北口岸"]
  }
};

const knownLegs = new Map([
  ["杭州|广州", { mode: "高铁/航班", hours: 6.4, cost: 720, comfort: 7 }],
  ["杭州|深圳", { mode: "高铁/航班", hours: 6.6, cost: 760, comfort: 7 }],
  ["杭州|澳门", { mode: "航班 + 口岸", hours: 5.2, cost: 980, comfort: 6 }],
  ["杭州|茂名", { mode: "高铁中转", hours: 9.3, cost: 830, comfort: 5 }],
  ["广州|深圳", { mode: "城际/高铁", hours: 1.2, cost: 85, comfort: 9 }],
  ["广州|茂名", { mode: "动车", hours: 2.6, cost: 210, comfort: 8 }],
  ["广州|澳门", { mode: "城际 + 口岸", hours: 2.7, cost: 180, comfort: 7 }],
  ["广州|佛山", { mode: "地铁/城际", hours: 0.8, cost: 20, comfort: 9 }],
  ["深圳|澳门", { mode: "船 / 跨城巴士", hours: 2.1, cost: 190, comfort: 7 }],
  ["深圳|茂名", { mode: "动车", hours: 3.8, cost: 290, comfort: 7 }],
  ["深圳|珠海", { mode: "高铁/城际", hours: 1.9, cost: 120, comfort: 8 }],
  ["澳门|茂名", { mode: "口岸 + 动车", hours: 4.2, cost: 260, comfort: 6 }],
  ["澳门|珠海", { mode: "口岸步行/巴士", hours: 0.8, cost: 35, comfort: 7 }],
  ["茂名|珠海", { mode: "动车", hours: 3.4, cost: 230, comfort: 7 }],
  ["佛山|深圳", { mode: "城际/高铁", hours: 1.5, cost: 95, comfort: 8 }],
  ["佛山|澳门", { mode: "城际 + 口岸", hours: 2.2, cost: 140, comfort: 7 }],
  ["佛山|茂名", { mode: "动车", hours: 2.4, cost: 180, comfort: 8 }],
  ["珠海|杭州", { mode: "航班/高铁中转", hours: 5.8, cost: 820, comfort: 6 }],
  ["广州|杭州", { mode: "高铁/航班", hours: 6.4, cost: 720, comfort: 7 }],
  ["深圳|杭州", { mode: "高铁/航班", hours: 6.6, cost: 760, comfort: 7 }],
  ["澳门|杭州", { mode: "口岸 + 航班", hours: 5.2, cost: 980, comfort: 6 }],
  ["茂名|杭州", { mode: "高铁中转", hours: 9.3, cost: 830, comfort: 5 }]
]);

const modeWeights = {
  balanced: { time: 0.36, cost: 0.34, comfort: 0.3 },
  cheap: { time: 0.24, cost: 0.56, comfort: 0.2 },
  fast: { time: 0.58, cost: 0.22, comfort: 0.2 },
  comfort: { time: 0.3, cost: 0.25, comfort: 0.45 }
};

const paceConfig = {
  relaxed: { maxActivities: 2, label: "舒适慢游", buffer: 1.18 },
  standard: { maxActivities: 3, label: "标准节奏", buffer: 1 },
  intense: { maxActivities: 4, label: "紧凑探索", buffer: 0.92 }
};

const MAX_ROUTE_CANDIDATES = 720;

export function getDefaultDestinations() {
  return ["广州", "深圳", "茂名", "澳门"];
}

export function planTrip(input) {
  const context = createPlannerContext(input);
  const days = getTripDays(input.startDate, input.endDate);
  const origin = normalizeCityName(input.origin || "杭州");
  const destinations = normalizeDestinations(input.destinations);
  const normalizedInput = {
    ...input,
    origin,
    destinations
  };
  const priority = input.priority || "balanced";
  const pace = paceConfig[input.pace] || paceConfig.standard;
  const candidates = rankRoutes(origin, destinations, priority, context);
  const plans = {
    balanced: buildPlan("balanced", candidates, normalizedInput, days, pace, context),
    cheap: buildPlan("cheap", candidates, normalizedInput, days, pace, context),
    fast: buildPlan("fast", candidates, normalizedInput, days, pace, context)
  };

  return {
    activePlan: priority === "comfort" ? "balanced" : priority,
    destinations,
    days,
    plans,
    dataMode: input.dataMode || "sample"
  };
}

export function getCityProfile(city, overrides = {}) {
  const base = cityProfiles[city] || createFallbackCity(city);
  const override = overrides[city];
  if (!override) return base;

  return {
    ...base,
    ...override,
    attractions: override.attractions || base.attractions,
    coordinates: override.coordinates || base.coordinates
  };
}

function createPlannerContext(input) {
  return {
    cityProfiles: input.cityProfiles || input.profileOverrides || {},
    legOverrides: normalizeLegOverrides(input.legOverrides || {}),
    transportModes: normalizeTransportModes(input.transportModes),
    hotelName: input.hotelName || ""
  };
}

function buildPlan(mode, candidates, input, days, pace, context) {
  const candidate = rankRoutes(input.origin, candidates.baseDestinations, mode, context)[0] || candidates[0];
  const route = [input.origin, ...candidate.order, input.origin];
  const legs = route.slice(0, -1).map((city, index) => getLeg(
    city,
    route[index + 1],
    context,
    mode,
    days[Math.min(index, Math.max(0, days.length - 1))]?.date || ""
  ));
  const transportCost = legs.reduce((sum, leg) => sum + leg.cost, 0);
  const transportHours = legs.reduce((sum, leg) => sum + leg.hours, 0);
  const stayPlan = allocateStayDays(candidate.order, days.length, context);
  const hotelCost = stayPlan.reduce((sum, item) => {
    const profile = getCityProfile(item.city, context.cityProfiles);
    return sum + profile.dailyHotel * Math.max(item.days - 1, 1);
  }, 0);
  const foodCost = stayPlan.reduce((sum, item) => {
    const profile = getCityProfile(item.city, context.cityProfiles);
    return sum + profile.dailyFood * item.days;
  }, 0);
  const activityCost = Math.round(days.length * (mode === "cheap" ? 105 : mode === "fast" ? 170 : 135));
  const totalCost = transportCost + hotelCost + foodCost + activityCost;
  const daily = buildDailyPlan(days, stayPlan, legs, pace, input.preferences || {}, mode, context);
  const scoreBreakdown = calculatePlanScore(totalCost, transportHours, candidate.comfort, input.budget, mode);
  const score = scoreBreakdown.total;

  return {
    mode,
    title: getPlanTitle(mode),
    route,
    legs,
    daily,
    stayPlan,
    budget: {
      transport: transportCost,
      hotel: hotelCost,
      food: foodCost,
      activities: activityCost,
      total: totalCost,
      userBudget: input.budget
    },
    transportHours,
    score,
    scoreBreakdown,
    rationale: getRationale(mode, candidate.order, totalCost, transportHours)
  };
}

function getTripDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return getTripDays("2026-10-01", "2026-10-07");
  }

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push({
      date: formatDateKey(cursor),
      label: `${cursor.getMonth() + 1}月${cursor.getDate()}日`
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function normalizeDestinations(destinations) {
  return [...new Set(destinations.map(normalizeCityName).filter(Boolean))];
}

export function normalizeCityName(value) {
  const raw = String(value || "").trim().replace(/\s+/g, "");
  if (!raw) return "";

  const aliases = {
    浙江杭州: "杭州",
    浙江省杭州: "杭州",
    浙江省杭州市: "杭州",
    杭州市: "杭州",
    广东广州: "广州",
    广东省广州: "广州",
    广东省广州市: "广州",
    广州市: "广州",
    广东深圳: "深圳",
    广东省深圳: "深圳",
    广东省深圳市: "深圳",
    深圳市: "深圳",
    广东珠海: "珠海",
    广东省珠海: "珠海",
    广东省珠海市: "珠海",
    珠海市: "珠海",
    广东佛山: "佛山",
    广东省佛山: "佛山",
    广东省佛山市: "佛山",
    佛山市: "佛山",
    广东茂名: "茂名",
    广东省茂名: "茂名",
    广东省茂名市: "茂名",
    茂名市: "茂名",
    澳门特别行政区: "澳门"
  };
  if (aliases[raw]) return aliases[raw];

  const knownCities = Object.keys(cityProfiles);
  const withoutSuffix = raw.replace(/市$|地区$|自治州$|特别行政区$/g, "");
  const knownCity = knownCities.find((city) => withoutSuffix.endsWith(city));
  if (knownCity) return knownCity;

  return withoutSuffix
    .replace(/省$/, "")
    .replace(/市$/, "");
}

function rankRoutes(origin, destinations, mode, context) {
  const baseDestinations = destinations.length ? destinations : getDefaultDestinations();
  const permutations = getRouteCandidates(baseDestinations, MAX_ROUTE_CANDIDATES);
  const weights = modeWeights[mode] || modeWeights.balanced;
  const scored = permutations.map((order) => {
    const fullRoute = [origin, ...order, origin];
    const legs = fullRoute.slice(0, -1).map((city, index) => getLeg(city, fullRoute[index + 1], context, mode));
    const time = legs.reduce((sum, leg) => sum + leg.hours, 0);
    const cost = legs.reduce((sum, leg) => sum + leg.cost, 0);
    const comfort = legs.reduce((sum, leg) => sum + leg.comfort, 0) / legs.length;
    const score = weights.time * normalize(time, 4, 26)
      + weights.cost * normalize(cost, 250, 3600)
      + weights.comfort * (1 - comfort / 10);
    return { order, time, cost, comfort, score };
  });

  const result = scored.sort((a, b) => a.score - b.score);
  result.baseDestinations = baseDestinations;
  return result;
}

function getRouteCandidates(items, limit) {
  const results = [];

  function walk(prefix, rest) {
    if (results.length >= limit) return;
    if (!rest.length) {
      results.push(prefix);
      return;
    }

    for (let index = 0; index < rest.length; index += 1) {
      walk(
        [...prefix, rest[index]],
        [...rest.slice(0, index), ...rest.slice(index + 1)]
      );
      if (results.length >= limit) return;
    }
  }

  walk([], items);
  return results;
}

function getLeg(from, to, context = {}, selectionMode = "balanced", travelDate = "") {
  const override = context.legOverrides?.[`${from}|${to}`] || context.legOverrides?.[`${to}|${from}`];
  let baseLeg = null;

  const direct = knownLegs.get(`${from}|${to}`) || knownLegs.get(`${to}|${from}`);
  if (override) {
    baseLeg = { from, to, ...override };
  } else if (direct) {
    baseLeg = { from, to, ...direct };
  }

  const fromProfile = getCityProfile(from, context.cityProfiles);
  const toProfile = getCityProfile(to, context.cityProfiles);
  const distance = haversine(fromProfile.coordinates, toProfile.coordinates);
  const distanceKm = baseLeg?.distanceKm || Number(distance.toFixed(1));
  if (baseLeg) {
    return chooseTransportOption(from, to, baseLeg, distanceKm, context.transportModes, selectionMode, travelDate);
  }

  const hours = Math.max(0.8, distance / 165 + 0.7);
  const cost = Math.round(distance * 0.52 + 80);
  return chooseTransportOption(from, to, {
    from,
    to,
    mode: distance > 850 ? "航班/高铁中转" : "高铁/城际",
    hours: Number(hours.toFixed(1)),
    cost,
    comfort: distance > 850 ? 6 : 7,
    distanceKm,
    source: "距离估算"
  }, distanceKm, context.transportModes, selectionMode, travelDate);
}

function createFallbackCity(city) {
  return {
    region: "自定义城市",
    stayArea: "核心商圈 / 交通枢纽周边",
    dailyHotel: 420,
    dailyFood: 190,
    coordinates: [113.2, 23.1],
    attractions: [`${city}城市漫步`, `${city}本地美食`, `${city}代表景点`, "咖啡休整"]
  };
}

function haversine([lng1, lat1], [lng2, lat2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function allocateStayDays(cities, totalDays, context) {
  const base = cities.map((city) => ({ city, days: 1 }));
  let remaining = Math.max(0, totalDays - base.length);
  const priorityCities = [...base].sort((a, b) => {
    const aProfile = getCityProfile(a.city, context.cityProfiles);
    const bProfile = getCityProfile(b.city, context.cityProfiles);
    const aScore = aProfile.attractions.length + aProfile.dailyHotel / 300;
    const bScore = bProfile.attractions.length + bProfile.dailyHotel / 300;
    return bScore - aScore;
  });

  while (remaining > 0) {
    for (const item of priorityCities) {
      if (remaining <= 0) break;
      const target = base.find((entry) => entry.city === item.city);
      target.days += 1;
      remaining -= 1;
    }
  }

  return base;
}

function buildDailyPlan(days, stayPlan, legs, pace, preferences, mode, context) {
  const expandedCities = stayPlan.flatMap((item) => Array.from({ length: item.days }, () => item.city));
  const usedByCity = new Map();
  const dayIndexByCity = new Map();

  return days.map((day, index) => {
    const city = expandedCities[index] || expandedCities[expandedCities.length - 1];
    const profile = getCityProfile(city, context.cityProfiles);
    const isMoveDay = index === 0 || city !== expandedCities[index - 1];
    const inboundLeg = isMoveDay ? legs.find((leg) => leg.to === city) : null;
    const cityDayIndex = dayIndexByCity.get(city) || 0;
    const usedTitles = usedByCity.get(city) || new Set();
    const attractions = chooseActivities(profile, pace.maxActivities, preferences, mode, cityDayIndex, usedTitles);
    const stayArea = deriveDayStayArea(city, profile, attractions);
    const hotel = selectRelevantHotel(normalizeHotel(profile.hotel), attractions);
    const transfers = buildDayTransfers(attractions, hotel);
    const badge = isMoveDay ? "移动日" : pace.label;
    dayIndexByCity.set(city, cityDayIndex + 1);
    usedByCity.set(city, usedTitles);

    return {
      ...day,
      city,
      badge,
      stayArea: hotel?.name || stayArea,
      hotel,
      transfers,
      localTransitMinutes: transfers.reduce((sum, item) => sum + item.minutes, 0),
      activities: [
        ...(isMoveDay && inboundLeg ? [{
          title: `抵达 ${city}`,
          meta: `${inboundLeg.mode}，约 ${formatHours(inboundLeg.hours)}，预估 ¥${inboundLeg.cost}${inboundLeg.distanceKm ? `，约 ${inboundLeg.distanceKm} 公里` : ""}`,
          source: inboundLeg.source || "交通估算",
          url: inboundLeg.bookingUrl || "",
          xiaohongshuUrl: buildXiaohongshuSearchUrl(`${inboundLeg.from} 到 ${inboundLeg.to} 交通攻略`)
        }] : []),
        ...attractions,
        {
          title: hotel ? `住宿：${hotel.name}` : `住宿建议：${stayArea}`,
          meta: hotel
            ? [hotel.address, "已按该住宿位置估算首末段日内交通"].filter(Boolean).join(" · ")
            : (profile.poiAttractions?.length ? "根据当天高德热门点位推荐活动半径" : "根据内置城市经验推荐"),
          source: hotel?.source || "住宿",
          coordinates: hotel?.coordinates,
          url: hotel?.url || "",
          xiaohongshuUrl: hotel?.xiaohongshuUrl || buildXiaohongshuSearchUrl(`${city} ${hotel?.name || stayArea} 住宿`)
        }
      ]
    };
  });
}

function chooseActivities(profile, count, preferences, mode, cityDayIndex, usedTitles) {
  const activities = profile.poiAttractions?.length
    ? profile.poiAttractions.map((poi) => normalizeActivity(poi, "高德POI"))
    : profile.attractions.map((title) => normalizeActivity(title, "内置推荐"));

  if (preferences.food && !activities.some((item) => activityText(item).includes("美食") || activityText(item).includes("早茶") || activityText(item).includes("粥"))) {
    activities.push(normalizeActivity(`${profile.region}美食探店`, "偏好补充"));
  }
  if (preferences.nature && !activities.some((item) => activityText(item).includes("海") || activityText(item).includes("公园") || activityText(item).includes("湾"))) {
    activities.push(normalizeActivity("公园或滨水散步", "偏好补充"));
  }
  if (mode === "cheap") {
    activities.push(normalizeActivity("免费街区漫游", "省钱策略"));
  }

  const unique = activities.filter((activity) => !usedTitles.has(activity.title));
  const pool = unique.length ? unique : activities;
  const selected = [];
  const grouped = profile.poiAttractions?.length ? groupActivitiesByArea(pool) : [];

  if (grouped.length) {
    const primaryGroup = grouped[cityDayIndex % grouped.length];
    for (const activity of primaryGroup.activities) {
      if (selected.length >= count) break;
      addSelectedActivity(selected, activity);
    }

    for (const group of grouped) {
      if (selected.length >= count) break;
      if (group === primaryGroup) continue;
      for (const activity of group.activities) {
        if (selected.length >= count) break;
        if (!isNearSelectedActivities(activity, selected)) continue;
        addSelectedActivity(selected, activity);
      }
    }
  }

  const fallbackPool = unique.length >= count ? unique : [...unique, ...activities.filter((activity) => usedTitles.has(activity.title))];
  const start = grouped.length ? 0 : (cityDayIndex * count) % Math.max(1, fallbackPool.length);
  for (let index = 0; index < fallbackPool.length && selected.length < count; index += 1) {
    const activity = fallbackPool[(start + index) % fallbackPool.length];
    if (grouped.length && !isNearSelectedActivities(activity, selected)) continue;
    addSelectedActivity(selected, activity);
  }

  selected.forEach((activity) => usedTitles.add(activity.title));
  return selected;
}

function addSelectedActivity(selected, activity) {
  if (!activity || selected.some((item) => item.title === activity.title)) return;
  selected.push(activity);
}

function isNearSelectedActivities(activity, selected) {
  if (!selected.length) return true;
  if (!Array.isArray(activity.coordinates)) return true;
  const selectedWithCoordinates = selected.filter((item) => Array.isArray(item.coordinates));
  if (!selectedWithCoordinates.length) return true;
  return selectedWithCoordinates.some((item) => haversine(item.coordinates, activity.coordinates) <= 180);
}

function normalizeActivity(activity, fallbackSource) {
  if (typeof activity === "string") {
    return {
      title: activity,
      meta: "",
      source: fallbackSource,
      url: buildAmapSearchUrl(activity),
      imageUrl: "",
      xiaohongshuUrl: buildXiaohongshuSearchUrl(`${activity} 攻略`)
    };
  }

  return {
    title: activity.title || activity.name || "推荐地点",
    meta: [activity.type, activity.address, activity.rating ? `评分 ${activity.rating}` : ""].filter(Boolean).join(" · "),
    source: activity.corePriority ? "核心地标" : (activity.source || fallbackSource),
    coordinates: activity.coordinates,
    areaLabel: activity.areaLabel || "",
    areaKey: activity.areaKey || activity.areaLabel || "",
    url: activity.url || "",
    imageUrl: activity.imageUrl || "",
    xiaohongshuUrl: activity.xiaohongshuUrl || buildXiaohongshuSearchUrl(`${activity.name || activity.title || ""} 攻略`),
    rating: activity.rating || "",
    corePriority: activity.corePriority || 0,
    recommendationReason: activity.recommendationReason || ""
  };
}

function activityText(activity) {
  return `${activity.title || ""}${activity.meta || ""}`;
}

function normalizeLegOverrides(overrides) {
  if (Array.isArray(overrides)) {
    return Object.fromEntries(overrides.map((leg) => [`${leg.from}|${leg.to}`, leg]));
  }
  return overrides;
}

function normalizeTransportModes(modes) {
  const normalized = Array.isArray(modes) ? modes.filter(Boolean) : [];
  return normalized.length ? normalized : ["rail", "flight", "driving"];
}

function chooseTransportOption(from, to, baseLeg, distanceKm, transportModes, selectionMode, travelDate = "") {
  const alternatives = buildTransportAlternatives(from, to, baseLeg, distanceKm, travelDate);
  const allowed = alternatives.filter((option) => transportModes.includes(option.type));
  const candidates = allowed.length ? allowed : alternatives;
  const selected = [...candidates].sort((a, b) => transportScore(a, selectionMode) - transportScore(b, selectionMode))[0] || baseLeg;

  return {
    ...selected,
    alternatives: alternatives.sort((a, b) => transportScore(a, selectionMode) - transportScore(b, selectionMode))
  };
}

function buildTransportAlternatives(from, to, baseLeg, distanceKm, travelDate = "") {
  const alternatives = [];
  const add = (option) => {
    if (!option || alternatives.some((item) => item.type === option.type)) return;
    alternatives.push({
      from,
      to,
      ...option,
      hours: Number(option.hours.toFixed(1)),
      cost: Math.max(20, Math.round(option.cost)),
      distanceKm: Number(distanceKm.toFixed(1)),
      bookingUrl: buildTransportSearchUrl(option.type, from, to, travelDate),
      bookingLabel: getTransportBookingLabel(option.type),
      bookingHint: travelDate ? `${travelDate} 出发查询` : "查询实时班次"
    });
  };

  add({
    type: "rail",
    label: "高铁/动车",
    mode: "高铁/动车估算",
    hours: Math.max(0.8, distanceKm / 245 + 1.1),
    cost: distanceKm * 0.46 + 55,
    comfort: 8,
    source: "交通方式估算"
  });

  if (distanceKm >= 420) {
    add({
      type: "flight",
      label: "航班",
      mode: "航班估算",
      hours: Math.max(3.0, distanceKm / 760 + 2.5),
      cost: distanceKm * 0.62 + 320,
      comfort: distanceKm > 1200 ? 8 : 6,
      source: "交通方式估算"
    });
  }

  if (distanceKm <= 850 || baseLeg.source === "高德路线") {
    add({
      type: "driving",
      label: "自驾",
      mode: baseLeg.source === "高德路线" ? "高德驾车路线估算" : "自驾估算",
      hours: baseLeg.source === "高德路线" ? baseLeg.hours : Math.max(1, distanceKm / 85 + 0.5),
      cost: baseLeg.source === "高德路线" ? baseLeg.cost : distanceKm * 0.72 + 45,
      comfort: distanceKm > 700 ? 5 : 7,
      source: baseLeg.source === "高德路线" ? "高德路线" : "交通方式估算"
    });
  }

  if (distanceKm <= 700) {
    add({
      type: "bus",
      label: "大巴",
      mode: "长途大巴估算",
      hours: Math.max(1, distanceKm / 72 + 0.8),
      cost: distanceKm * 0.28 + 35,
      comfort: 5,
      source: "交通方式估算"
    });
  }

  return alternatives.length ? alternatives : [{
    ...baseLeg,
    type: "mixed",
    label: baseLeg.mode,
    source: baseLeg.source || "交通估算",
    distanceKm,
    bookingUrl: buildTransportSearchUrl("mixed", from, to, travelDate),
    bookingLabel: "查询"
  }];
}

function groupActivitiesByArea(activities) {
  const groups = new Map();
  activities.forEach((activity, index) => {
    const key = activity.areaKey || activity.areaLabel || coordinateAreaKey(activity.coordinates) || "default";
    const label = activity.areaLabel || key;
    const group = groups.get(key) || {
      key,
      label,
      firstIndex: index,
      score: 0,
      activities: []
    };
    group.activities.push(activity);
    group.score += scoreActivityForGrouping(activity, index);
    groups.set(key, group);
  });

  return [...groups.values()]
    .filter((group) => group.activities.length)
    .sort((a, b) => b.score - a.score || a.firstIndex - b.firstIndex);
}

function scoreActivityForGrouping(activity, index) {
  const ratingScore = Number(activity.rating || 0) * 2;
  return Math.max(1, 30 - index) + ratingScore;
}

function coordinateAreaKey(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return "";
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return "";
  return `${Math.round(lng * 2) / 2},${Math.round(lat * 2) / 2}`;
}

function deriveDayStayArea(city, profile, activities) {
  const labelCounts = new Map();
  activities.forEach((activity) => {
    const label = activity.areaLabel || "";
    if (!label || label === city) return;
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  });

  const [bestLabel] = [...labelCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0] || [];
  if (bestLabel) return `${bestLabel}住宿圈`;

  const names = activities
    .filter((activity) => activity.source === "高德POI" || activity.coordinates)
    .slice(0, 2)
    .map((activity) => activity.title.replace(city, "").trim())
    .filter(Boolean);

  if (names.length) return `${names.join(" / ")} 周边`;
  return profile.stayArea || "核心商圈 / 交通枢纽周边";
}

function normalizeHotel(hotel) {
  if (!hotel?.name || !Array.isArray(hotel.coordinates)) return null;
  return {
    title: hotel.name,
    name: hotel.name,
    address: hotel.address || "",
    source: hotel.source || "住宿",
    coordinates: hotel.coordinates,
    url: hotel.url || "",
    xiaohongshuUrl: hotel.xiaohongshuUrl || buildXiaohongshuSearchUrl(`${hotel.name} 住宿攻略`)
  };
}

function selectRelevantHotel(hotel, activities) {
  if (!hotel) return null;
  const stops = activities.filter((activity) => Array.isArray(activity.coordinates));
  if (!stops.length) return hotel;
  const nearestDistance = Math.min(...stops.map((activity) => haversine(hotel.coordinates, activity.coordinates)));
  return nearestDistance <= 120 ? hotel : null;
}

function buildDayTransfers(activities, hotel) {
  const stops = activities
    .filter((activity) => Array.isArray(activity.coordinates) && activity.coordinates.length === 2)
    .map((activity) => ({
      name: activity.title,
      coordinates: activity.coordinates
    }));

  if (stops.length < 2 && !hotel) return [];

  const transfers = [];
  if (hotel && stops[0]) transfers.push(estimateLocalTransfer(hotel, stops[0]));
  for (let index = 0; index < stops.length - 1; index += 1) {
    transfers.push(estimateLocalTransfer(stops[index], stops[index + 1]));
  }
  if (hotel && stops.length) transfers.push(estimateLocalTransfer(stops[stops.length - 1], hotel));

  return transfers.filter(Boolean);
}

function estimateLocalTransfer(from, to) {
  if (!Array.isArray(from.coordinates) || !Array.isArray(to.coordinates)) return null;
  const distanceKm = haversine(from.coordinates, to.coordinates);
  if (!Number.isFinite(distanceKm)) return null;
  const mode = getLocalTransitMode(distanceKm);
  const speed = distanceKm > 150 ? 86 : distanceKm > 60 ? 62 : distanceKm > 8 ? 30 : 12;
  const buffer = distanceKm > 60 ? 18 : distanceKm > 8 ? 12 : 6;
  const minutes = Math.max(6, Math.round((distanceKm / speed) * 60 + buffer));

  return {
    from: from.name,
    to: to.name,
    mode,
    minutes,
    distanceKm: Number(distanceKm.toFixed(1))
  };
}

function getLocalTransitMode(distanceKm) {
  if (distanceKm > 180) return "跨城/包车估算";
  if (distanceKm > 60) return "包车/自驾估算";
  if (distanceKm > 8) return "打车/公交估算";
  return "步行/短途打车估算";
}

function buildTransportSearchUrl(type, from, to, travelDate = "") {
  const query = encodeURIComponent(`${from} 到 ${to}${travelDate ? ` ${travelDate}` : ""}`);
  if (type === "rail") return "https://kyfw.12306.cn/otn/leftTicket/init";
  if (type === "flight") return "https://flights.ctrip.com/";
  if (type === "bus") return `https://bus.ctrip.com/?keyword=${query}`;
  if (type === "driving") return `https://www.amap.com/search?query=${query}%20自驾路线`;
  return `https://www.ctrip.com/?keyword=${query}`;
}

function getTransportBookingLabel(type) {
  const labels = {
    rail: "12306",
    flight: "携程机票",
    bus: "携程汽车票",
    driving: "高德路线"
  };
  return labels[type] || "查询";
}

function buildXiaohongshuSearchUrl(query) {
  const keyword = String(query || "").trim();
  if (!keyword) return "";
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
}

function buildAmapSearchUrl(query) {
  const keyword = String(query || "").trim();
  if (!keyword) return "";
  return `https://www.amap.com/search?query=${encodeURIComponent(keyword)}`;
}

function transportScore(option, selectionMode) {
  if (selectionMode === "cheap") return option.cost;
  if (selectionMode === "fast") return option.hours * 100 + option.cost * 0.03;
  if (selectionMode === "comfort") return (10 - option.comfort) * 100 + option.hours * 5;
  return option.hours * 42 + option.cost * 0.12 + (10 - option.comfort) * 18;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculatePlanScore(totalCost, transportHours, comfort, budget, mode) {
  const budgetFit = budget ? Math.max(0, Math.min(1, 1 - Math.max(0, totalCost - budget) / budget)) : 0.7;
  const timeFit = Math.max(0, Math.min(1, 1 - transportHours / 28));
  const comfortFit = comfort / 10;
  const weights = modeWeights[mode] || modeWeights.balanced;
  const score = budgetFit * weights.cost + timeFit * weights.time + comfortFit * weights.comfort;
  return {
    total: Math.round(score * 100),
    formula: `预算 ${Math.round(weights.cost * 100)}% + 省时 ${Math.round(weights.time * 100)}% + 舒适 ${Math.round(weights.comfort * 100)}%`,
    dimensions: [
      {
        key: "budget",
        label: "预算匹配",
        score: Math.round(budgetFit * 100),
        weight: Math.round(weights.cost * 100),
        detail: totalCost <= budget ? "预计花费在预算内" : "预计花费超过预算"
      },
      {
        key: "time",
        label: "省时效率",
        score: Math.round(timeFit * 100),
        weight: Math.round(weights.time * 100),
        detail: `跨城交通约 ${formatHours(transportHours)}`
      },
      {
        key: "comfort",
        label: "舒适度",
        score: Math.round(comfortFit * 100),
        weight: Math.round(weights.comfort * 100),
        detail: "按换乘复杂度和交通方式估算"
      }
    ]
  };
}

function getPlanTitle(mode) {
  const titles = {
    balanced: "均衡方案",
    cheap: "省钱方案",
    fast: "省时间方案"
  };
  return titles[mode] || "推荐方案";
}

function getRationale(mode, order, totalCost, transportHours) {
  const cityText = order.join(" → ");
  const common = `城市顺序为 ${cityText}，总交通约 ${formatHours(transportHours)}，总预算约 ¥${formatCurrency(totalCost)}。`;
  if (mode === "cheap") {
    return `${common} 该方案优先减少跨城长距离跳跃，把相邻城市串联起来，适合预算敏感型旅行。`;
  }
  if (mode === "fast") {
    return `${common} 该方案优先使用大交通枢纽进出，减少回头路和中转等待。`;
  }
  return `${common} 该方案在费用、时间和游玩舒适度之间做了折中，适合第一次做自动规划验证。`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN").format(Math.round(value));
}

function formatHours(value) {
  return `${Number(value.toFixed(1))} 小时`;
}

export const formatters = {
  currency: formatCurrency,
  hours: formatHours
};
