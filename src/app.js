import { formatters, getDefaultDestinations, planTrip } from "./planner.js";

const state = {
  destinations: getDefaultDestinations(),
  result: null,
  activePlan: "balanced"
};

const form = document.querySelector("#trip-form");
const originInput = document.querySelector("#origin");
const budgetInput = document.querySelector("#budget");
const startDateInput = document.querySelector("#start-date");
const endDateInput = document.querySelector("#end-date");
const priorityInput = document.querySelector("#priority");
const paceInput = document.querySelector("#pace");
const destinationInput = document.querySelector("#destination-input");
const hotelNameInput = document.querySelector("#hotel-name");
const tagsContainer = document.querySelector("#destination-tags");
const routeTitle = document.querySelector("#route-title");
const routeMapImage = document.querySelector(".map-visual img");
const mapOpenButton = document.querySelector("#map-open-button");
const summaryDays = document.querySelector("#summary-days");
const summaryCost = document.querySelector("#summary-cost");
const summaryTime = document.querySelector("#summary-time");
const summaryScore = document.querySelector("#summary-score");
const tabs = document.querySelectorAll(".tab");
const planDetail = document.querySelector("#plan-detail");
const dayTemplate = document.querySelector("#day-template");
const backendStatus = document.querySelector("#backend-status");
const submitButton = form.querySelector("button[type='submit']");
const submitLabel = document.querySelector("#submit-label");
const detailModal = document.querySelector("#detail-modal");
const modalKicker = document.querySelector("#modal-kicker");
const modalTitle = document.querySelector("#modal-title");
const modalBody = document.querySelector("#modal-body");
const maxDestinations = 8;

function init() {
  renderTags();
  bindEvents();
  generatePlan();
}

function bindEvents() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generatePlan();
  });

  destinationInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addDestination(destinationInput.value);
    destinationInput.value = "";
  });

  tagsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-city]");
    if (!button) return;
    state.destinations = state.destinations.filter((city) => city !== button.dataset.city);
    renderTags();
    generatePlan();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActivePlan(tab.dataset.plan);
    });
  });

  mapOpenButton.addEventListener("click", () => {
    if (!state.currentPlan) return;
    openMapModal(state.currentPlan);
  });

  planDetail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-day-index]");
    if (!button || !state.currentPlan) return;
    openDayModal(state.currentPlan.daily[Number(button.dataset.dayIndex)]);
  });

  detailModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function addDestination(rawValue) {
  const nextCities = rawValue
    .split(/[,，、\s]+/)
    .map((city) => city.trim())
    .filter(Boolean);

  if (!nextCities.length) return;
  state.destinations = [...new Set([...state.destinations, ...nextCities])].slice(0, maxDestinations);
  renderTags();
  generatePlan();
}

function renderTags() {
  tagsContainer.innerHTML = "";

  state.destinations.forEach((city) => {
    const tag = document.createElement("span");
    tag.className = "destination-tag";
    const label = document.createElement("span");
    const removeButton = document.createElement("button");
    label.textContent = city;
    removeButton.type = "button";
    removeButton.dataset.city = city;
    removeButton.setAttribute("aria-label", `删除 ${city}`);
    removeButton.textContent = "×";
    tag.append(label, removeButton);
    tagsContainer.appendChild(tag);
  });
}

function collectInput() {
  const preferences = Object.fromEntries(
    [...form.querySelectorAll("input[data-pref]")].map((checkbox) => [checkbox.name, checkbox.checked])
  );
  const transportModes = [...form.querySelectorAll("input[name='transportMode']:checked")]
    .map((checkbox) => checkbox.value);

  if (!transportModes.length) {
    transportModes.push("rail", "flight", "driving");
  }

  return {
    origin: originInput.value.trim() || "杭州",
    budget: Number(budgetInput.value) || 6800,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    priority: priorityInput.value,
    pace: paceInput.value,
    hotelName: hotelNameInput.value.trim(),
    destinations: state.destinations,
    transportModes,
    preferences
  };
}

async function generatePlan() {
  const input = collectInput();
  setLoading(true);

  try {
    const payload = await requestPlan(input);
    state.result = payload.result;
    renderDataStatus(payload);
  } catch (error) {
    state.result = planTrip(input);
    renderDataStatus({
      dataMode: "local",
      dataSources: ["浏览器本地规划"],
      warnings: ["后端 API 暂不可用，已自动切换到本地规划。"]
    });
  } finally {
    state.activePlan = state.result.activePlan;
    setActivePlan(state.activePlan);
    setLoading(false);
  }
}

function setActivePlan(planKey) {
  if (!state.result?.plans[planKey]) return;
  state.activePlan = planKey;
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.plan === planKey));
  renderPlan(state.result.plans[planKey]);
}

function renderPlan(plan) {
  state.currentPlan = plan;
  routeTitle.textContent = plan.route.join(" → ");
  routeMapImage.src = plan.map?.url || "./assets/route-map.png";
  routeMapImage.alt = `${plan.map?.provider || "旅行路线图"}：${plan.route.join(" → ")}`;
  mapOpenButton.disabled = !plan.map?.url;
  summaryDays.textContent = `${state.result.days.length} 天`;
  summaryCost.textContent = `¥${formatters.currency(plan.budget.total)}`;
  summaryTime.textContent = formatters.hours(plan.transportHours);
  summaryScore.textContent = `${plan.score}`;

  planDetail.innerHTML = "";
  planDetail.appendChild(renderPlanHeader(plan));
  planDetail.appendChild(renderTransport(plan));
  planDetail.appendChild(renderBudget(plan));
  planDetail.appendChild(renderDaily(plan));
}

function renderPlanHeader(plan) {
  const section = document.createElement("section");
  section.className = "detail-section plan-summary";
  section.innerHTML = `
    <div>
      <p class="section-kicker">${escapeHtml(plan.title)}</p>
      <h2>${escapeHtml(plan.route.join(" → "))}</h2>
      <p>${escapeHtml(plan.rationale)}</p>
    </div>
    <div class="budget-status ${plan.budget.total <= plan.budget.userBudget ? "is-ok" : "is-over"}">
      <span>预算状态</span>
      <strong>${plan.budget.total <= plan.budget.userBudget ? "预算内" : "超预算"}</strong>
    </div>
  `;
  return section;
}

async function requestPlan(input) {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Plan API failed: ${response.status}`);
  }

  return response.json();
}

function renderDataStatus(payload) {
  const modeText = {
    sample: "已连接后端规划服务，当前使用内置估算数据。",
    hybrid: "已连接后端规划服务，正在使用真实地理编码 + 估算规划。",
    amap: "已连接后端规划服务，正在使用高德 POI、路线估算和动态地图。",
    local: "后端未连接，当前使用浏览器本地规划。"
  };
  const sources = payload.dataSources?.length ? ` 数据源：${payload.dataSources.join("、")}。` : "";
  const warningText = payload.warnings?.length ? ` 提醒：${payload.warnings[0]}` : "";
  backendStatus.textContent = `${modeText[payload.dataMode] || modeText.sample}${sources}${warningText}`;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.querySelector("span").textContent = isLoading ? "…" : "↻";
  submitLabel.textContent = isLoading ? "正在生成..." : "生成旅行方案";
}

function renderTransport(plan) {
  const section = document.createElement("section");
  section.className = "detail-section";
  section.innerHTML = `
    <div class="section-head">
      <div>
        <p class="section-kicker">Transport</p>
        <h2>跨城交通</h2>
      </div>
      <span>${plan.legs.length} 段</span>
    </div>
    <div class="leg-list">
      ${plan.legs.map((leg) => `
        <article class="leg-card">
          <div class="leg-main">
            <strong>${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</strong>
            <span>${escapeHtml(leg.label || leg.mode)} · ${escapeHtml(leg.mode)}</span>
          </div>
          <div class="leg-stat">
            <strong>${formatters.hours(leg.hours)}</strong>
            <span>${leg.distanceKm ? `${leg.distanceKm} 公里 · ` : ""}¥${formatters.currency(leg.cost)}</span>
          </div>
          <div class="transport-options">
            ${(leg.alternatives || []).map((option) => `
              ${option.bookingUrl ? `<a class="${option.type === leg.type ? "is-selected" : ""}" href="${escapeHtml(option.bookingUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(option.bookingHint || "")}">` : `<span class="${option.type === leg.type ? "is-selected" : ""}">`}
                ${escapeHtml(option.label || option.mode)} · ${formatters.hours(option.hours)} · ¥${formatters.currency(option.cost)}
                ${option.bookingLabel ? `<em>${escapeHtml(option.bookingLabel)}</em>` : ""}
              ${option.bookingUrl ? "</a>" : "</span>"}
            `).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
  return section;
}

function renderBudget(plan) {
  const budgetItems = [
    ["交通", plan.budget.transport],
    ["住宿", plan.budget.hotel],
    ["餐饮", plan.budget.food],
    ["门票/活动", plan.budget.activities]
  ];
  const section = document.createElement("section");
  section.className = "detail-section";
  section.innerHTML = `
    <div class="section-head">
      <div>
        <p class="section-kicker">Budget</p>
        <h2>预算拆分</h2>
      </div>
      <span>用户预算 ¥${formatters.currency(plan.budget.userBudget)}</span>
    </div>
    <div class="budget-bars">
      ${budgetItems.map(([label, value]) => `
        <div class="budget-row">
          <div>
            <span>${label}</span>
            <strong>¥${formatters.currency(value)}</strong>
          </div>
          <div class="bar"><span style="width:${Math.min(100, Math.round(value / plan.budget.total * 100))}%"></span></div>
        </div>
      `).join("")}
    </div>
  `;
  return section;
}

function renderDaily(plan) {
  const section = document.createElement("section");
  section.className = "detail-section";
  section.innerHTML = `
    <div class="section-head">
      <div>
        <p class="section-kicker">Itinerary</p>
        <h2>每日行程</h2>
      </div>
      <span>${plan.daily.length} 天</span>
    </div>
  `;

  const timeline = document.createElement("div");
  timeline.className = "timeline";
  plan.daily.forEach((day, index) => {
    const card = dayTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".day-date").textContent = day.label;
    card.querySelector("h3").textContent = `${day.city} · ${day.stayArea}`;
    card.querySelector(".day-badge").textContent = day.badge;
    card.querySelector(".day-detail-button").dataset.dayIndex = String(index);
    const list = card.querySelector(".activity-list");
    day.activities.forEach((activity) => {
      const item = document.createElement("li");
      const normalized = normalizeActivityForView(activity);
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const source = document.createElement("em");
      title.className = "activity-title";
      meta.className = "activity-meta";
      source.className = "activity-source";
      title.textContent = normalized.title;
      meta.textContent = normalized.meta;
      source.textContent = normalized.source;
      if (normalized.guideUrl || normalized.url) {
        const link = document.createElement("a");
        link.href = normalized.guideUrl || normalized.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.className = "activity-title";
        link.textContent = normalized.title;
        item.append(link);
      } else {
        item.append(title);
      }
      if (normalized.meta) item.append(meta);
      if (normalized.source) item.append(source);
      list.appendChild(item);
    });
    if (day.transfers?.length) {
      const transferSummary = document.createElement("div");
      transferSummary.className = "day-transfer-summary";
      transferSummary.textContent = `日内交通约 ${formatMinutes(day.localTransitMinutes)} · ${day.transfers.length} 段`;
      card.insertBefore(transferSummary, card.querySelector(".day-detail-button"));
    }
    timeline.appendChild(card);
  });

  section.appendChild(timeline);
  return section;
}

function normalizeActivityForView(activity) {
  if (typeof activity === "string") {
    return {
      title: activity,
      meta: "",
      source: "",
      url: "",
      guideUrl: ""
    };
  }

  return {
    title: activity.title || "推荐活动",
    meta: activity.meta || "",
    source: activity.source || "",
    url: activity.url || "",
    guideUrl: activity.xiaohongshuUrl || activity.guideUrl || "",
    imageUrl: activity.imageUrl || ""
  };
}

function openMapModal(plan) {
  modalKicker.textContent = plan.map?.provider || "路线地图";
  modalTitle.textContent = plan.route.join(" → ");
  modalBody.innerHTML = "";

  const image = document.createElement("img");
  image.className = "modal-map-image";
  image.src = plan.map?.url || "./assets/route-map.png";
  image.alt = `路线地图：${plan.route.join(" → ")}`;
  modalBody.appendChild(image);

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  if (plan.map?.openUrl) {
    const link = document.createElement("a");
    link.href = plan.map.openUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "在高德地图中查看";
    actions.appendChild(link);
  }
  modalBody.appendChild(actions);
  openModal();
}

function openDayModal(day) {
  if (!day) return;

  modalKicker.textContent = `${day.label} · ${day.badge}`;
  modalTitle.textContent = `${day.city} · ${day.stayArea}`;
  modalBody.innerHTML = "";

  const list = document.createElement("div");
  list.className = "modal-activity-list";
  if (day.transfers?.length) {
    const transferPanel = document.createElement("section");
    transferPanel.className = "modal-transfer-panel";

    const transferTitle = document.createElement("h3");
    transferTitle.textContent = `日内交通约 ${formatMinutes(day.localTransitMinutes)}`;
    transferPanel.appendChild(transferTitle);

    const transferList = document.createElement("ol");
    day.transfers.forEach((transfer) => {
      const item = document.createElement("li");
      item.innerHTML = `
        <strong>${escapeHtml(transfer.from)} → ${escapeHtml(transfer.to)}</strong>
        <span>${escapeHtml(transfer.mode)} · ${formatMinutes(transfer.minutes)}${transfer.distanceKm ? ` · ${transfer.distanceKm} 公里` : ""}</span>
      `;
      transferList.appendChild(item);
    });
    transferPanel.appendChild(transferList);
    modalBody.appendChild(transferPanel);
  }

  day.activities.forEach((activity) => {
    const normalized = normalizeActivityForView(activity);
    const item = document.createElement("article");
    item.className = "modal-activity";

    if (normalized.imageUrl) {
      const image = document.createElement("img");
      image.src = normalized.imageUrl;
      image.alt = normalized.title;
      item.appendChild(image);
    }

    const content = document.createElement("div");
    const primaryUrl = normalized.guideUrl || normalized.url;
    const title = document.createElement(primaryUrl ? "a" : "strong");
    title.textContent = normalized.title;
    title.className = "modal-activity-title";
    if (primaryUrl) {
      title.href = primaryUrl;
      title.target = "_blank";
      title.rel = "noreferrer";
    }
    content.appendChild(title);

    if (normalized.meta) {
      const meta = document.createElement("p");
      meta.textContent = normalized.meta;
      content.appendChild(meta);
    }

    if (normalized.source) {
      const source = document.createElement("span");
      source.textContent = normalized.source;
      content.appendChild(source);
    }

    const actions = document.createElement("div");
    actions.className = "modal-activity-actions";
    if (normalized.guideUrl) {
      actions.appendChild(createTextLink("小红书攻略", normalized.guideUrl));
    }
    if (normalized.url) {
      actions.appendChild(createTextLink("高德地图", normalized.url));
    }
    if (actions.childElementCount) content.appendChild(actions);

    item.appendChild(content);
    list.appendChild(item);
  });

  modalBody.appendChild(list);
  openModal();
}

function openModal() {
  detailModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeModal() {
  detailModal.classList.add("is-hidden");
  document.body.classList.remove("modal-open");
}

function createTextLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = label;
  return link;
}

function formatMinutes(minutes) {
  const value = Number(minutes || 0);
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest ? `${hours}小时${rest}分钟` : `${hours}小时`;
  }
  return `${value}分钟`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
