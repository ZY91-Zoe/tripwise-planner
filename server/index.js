import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getCityProfile, normalizeCityName, planTrip } from "../src/planner.js";
import { loadLocalEnv } from "./services/env.js";
import { buildAmapContext, buildMarkerMapUrl, buildStaticMapUrl } from "./services/amap.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
loadLocalEnv(projectRoot);

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "tripwise-planner",
        version: "0.6.2",
        liveDataConfigured: Boolean(getAmapKey()),
        timestamp: new Date().toISOString()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/map") {
      return proxyAmapMap(url, response);
    }

    if (request.method === "POST" && url.pathname === "/api/plan") {
      const body = await readJsonBody(request, response);
      if (!body) return;
      const input = sanitizePlanInput(body);
      const liveContext = await buildAmapContext(input);
      const result = planTrip({
        ...input,
        ...liveContext
      });
      attachPlanAssets(result, liveContext);

      return sendJson(response, 200, {
        ok: true,
        generatedAt: new Date().toISOString(),
        dataMode: liveContext.dataMode,
        dataSources: liveContext.dataSources,
        warnings: liveContext.warnings,
        result
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return sendJson(response, 405, { ok: false, error: "Method not allowed" });
    }

    return serveStatic(url.pathname, request, response);
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, {
      ok: false,
      error: "Internal server error"
    });
  }
});

server.listen(port, host, () => {
  console.log(`TripWise Planner is running at http://${host}:${port}`);
});

function getAmapKey() {
  return process.env.AMAP_API_KEY || process.env.GAODE_API_KEY || "";
}

function attachPlanAssets(result, context) {
  for (const plan of Object.values(result.plans || {})) {
    const points = plan.route
      .map((city) => getCityProfile(city, context.cityProfiles).coordinates)
      .filter((point) => Array.isArray(point) && point.length === 2);
    const query = points.map((point) => point.join(",")).join(";");

    plan.map = {
      url: getAmapKey() && query ? `/api/map?points=${encodeURIComponent(query)}` : "./assets/route-map.png",
      openUrl: buildMarkerMapUrl(points, plan.route),
      provider: getAmapKey() ? "高德静态地图" : "本地示意图"
    };
  }
}

async function readJsonBody(request, response) {
  let body = "";
  try {
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 64 * 1024) {
        sendJson(response, 413, { ok: false, error: "Request body too large" });
        return null;
      }
    }
    return body ? JSON.parse(body) : {};
  } catch {
    sendJson(response, 400, { ok: false, error: "Invalid JSON body" });
    return null;
  }
}

function sanitizePlanInput(raw) {
  const destinations = Array.isArray(raw.destinations)
    ? raw.destinations
    : String(raw.destinations || "").split(/[,，、\s]+/);
  const transportModes = Array.isArray(raw.transportModes) ? raw.transportModes : [];

  return {
    origin: normalizeCityName(sanitizeText(raw.origin, "杭州")),
    startDate: sanitizeDate(raw.startDate, "2026-10-01"),
    endDate: sanitizeDate(raw.endDate, "2026-10-07"),
    hotelName: sanitizeText(raw.hotelName, "", 80),
    destinations: destinations.map((city) => normalizeCityName(sanitizeText(city, ""))).filter(Boolean).slice(0, 8),
    budget: clamp(Number(raw.budget || 6800), 800, 200000),
    priority: ["balanced", "cheap", "fast", "comfort"].includes(raw.priority) ? raw.priority : "balanced",
    pace: ["relaxed", "standard", "intense"].includes(raw.pace) ? raw.pace : "standard",
    transportModes: transportModes.filter((mode) => ["rail", "flight", "driving", "bus"].includes(mode)),
    preferences: {
      food: Boolean(raw.preferences?.food),
      culture: Boolean(raw.preferences?.culture),
      nature: Boolean(raw.preferences?.nature)
    }
  };
}

function sanitizeText(value, fallback, maxLength = 30) {
  const text = String(value || "").trim().replace(/[<>]/g, "");
  return text.slice(0, maxLength) || fallback;
}

function sanitizeDate(value, fallback) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : fallback;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function serveStatic(pathname, request, response) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(projectRoot, safePath));

  if (!filePath.startsWith(projectRoot)) {
    return sendJson(response, 403, { ok: false, error: "Forbidden" });
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      return sendJson(response, 404, { ok: false, error: "Not found" });
    }
    const data = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-store"
    });
    if (request.method === "HEAD") return response.end();
    return response.end(data);
  } catch {
    return sendJson(response, 404, { ok: false, error: "Not found" });
  }
}

async function proxyAmapMap(url, response) {
  const points = parseMapPoints(url.searchParams.get("points") || "");
  const apiKey = getAmapKey();
  const mapUrl = buildStaticMapUrl(points, apiKey);

  if (!mapUrl) {
    return serveFallbackMap(response);
  }

  try {
    const upstream = await fetch(mapUrl);
    if (!upstream.ok) {
      return serveFallbackMap(response);
    }
    const contentType = upstream.headers.get("content-type") || "image/png";
    const data = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": data.length,
      "Cache-Control": "no-store"
    });
    return response.end(data);
  } catch {
    return serveFallbackMap(response);
  }
}

function parseMapPoints(value) {
  return value.split(";")
    .map((pair) => pair.split(",").map(Number))
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

async function serveFallbackMap(response) {
  const data = await readFile(resolve(projectRoot, "assets/route-map.png"));
  response.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": data.length,
    "Cache-Control": "no-store"
  });
  response.end(data);
}

function sendJson(response, statusCode, payload) {
  const data = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-store"
  });
  response.end(data);
}
