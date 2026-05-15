import { planTrip } from "../src/planner.js";
import { buildAmapContext } from "../server/services/amap.js";

process.env.AMAP_API_KEY = "";
process.env.GAODE_API_KEY = "";

const input = {
  origin: "杭州",
  startDate: "2026-10-01",
  endDate: "2026-10-07",
  destinations: ["广州", "深圳", "茂名", "澳门"],
  budget: 6800,
  priority: "balanced",
  pace: "standard",
  preferences: {
    food: true,
    culture: true,
    nature: false
  }
};

const context = await buildAmapContext(input);
const result = planTrip({
  ...input,
  ...context
});

const balanced = result.plans.balanced;

if (!result.days.length) {
  throw new Error("Expected trip days to be generated.");
}

if (!balanced.route.includes("广州") || !balanced.route.includes("澳门")) {
  throw new Error("Expected generated route to include requested cities.");
}

if (balanced.daily.length !== 7) {
  throw new Error(`Expected 7 daily plans, got ${balanced.daily.length}.`);
}

console.log(JSON.stringify({
  ok: true,
  dataMode: context.dataMode,
  route: balanced.route,
  days: balanced.daily.length,
  totalCost: balanced.budget.total,
  score: balanced.score
}, null, 2));
