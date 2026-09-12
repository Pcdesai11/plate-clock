import {
  RATES,
  COMPARATORS,
  FOODS,
  SOURCES,
  yearProgress,
  dietFootprint,
  formatInt,
  formatClock,
} from "./data.js";
import { createGlobe } from "./globe.js";

const $ = (id) => document.getElementById(id);

const state = {
  mode: "current",
  perWeek: Object.fromEntries(
    Object.entries(FOODS).map(([id, f]) => [id, f.defaultPerWeek])
  ),
  openedAt: Date.now(),
};

function worldNow(now = Date.now()) {
  const p = yearProgress(now);
  return {
    livestock: RATES.livestockCo2eTonnesPerYear * p,
    food: RATES.foodSystemCo2eTonnesPerYear * p,
    animals: RATES.landAnimalsSlaughteredPerYear * p,
    chickens: RATES.chickensSlaughteredPerYear * p,
    cattle: RATES.cattleSlaughteredPerYear * p,
    forest: RATES.tropicalPrimaryForestHaPerYear * p,
  };
}

function personal() {
  return {
    current: dietFootprint(state.perWeek, "current"),
    nobeef: dietFootprint(state.perWeek, "nobeef"),
    vegetarian: dietFootprint(state.perWeek, "vegetarian"),
    vegan: dietFootprint(state.perWeek, "vegan"),
  };
}

function drivingKm(tonnes) {
  return (tonnes * 1000) / COMPARATORS.kgCo2ePerKmDriving;
}

function renderStatic() {
  const sliders = $("sliders");
  sliders.innerHTML = "";
  for (const [id, food] of Object.entries(FOODS)) {
    const wrap = document.createElement("div");
    wrap.className = "slider";
    wrap.innerHTML = `
      <label>
        <span>${food.label}</span>
        <b data-val="${id}">${state.perWeek[id]}</b>
      </label>
      <input type="range" min="0" max="14" step="1" value="${state.perWeek[id]}" data-food="${id}" />
    `;
    sliders.appendChild(wrap);
  }

  sliders.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-food]");
    if (!input) return;
    state.perWeek[input.dataset.food] = Number(input.value);
    sliders.querySelector(`[data-val="${input.dataset.food}"]`).textContent = input.value;
    renderPersonal();
  });

  $("modes").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    state.mode = btn.dataset.mode;
    for (const b of $("modes").querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === btn));
    }
    renderPersonal();
  });

  const sourceList = $("source-list");
  sourceList.innerHTML = SOURCES.map(
    (s) => `<li><b>${s.claim}</b><br>${s.source}</li>`
  ).join("");
}

function renderWorld(now) {
  const w = worldNow(now);
  $("livestock-num").textContent = formatInt(w.livestock);
  $("animals-num").textContent = formatInt(w.animals);
  $("forest-num").textContent = formatInt(w.forest);
  $("cattle-num").textContent = formatInt(w.cattle);

  const elapsed = now - state.openedAt;
  const yearMs = 365.25 * 24 * 3600 * 1000;
  const sessionTonnes = RATES.livestockCo2eTonnesPerYear * (elapsed / yearMs);
  const sessionAnimals = RATES.landAnimalsSlaughteredPerYear * (elapsed / yearMs);
  $("session").textContent =
    `On this page ${formatClock(elapsed)} · livestock emitted ${formatInt(sessionTonnes)} tonnes CO₂e · ${formatInt(sessionAnimals)} animals`;
}

function renderPersonal() {
  const d = personal();
  const chosen = d[state.mode];
  const saved = Math.max(0, d.current.tonnes - chosen.tonnes);
  $("you-now").textContent = `${d.current.tonnes.toFixed(1)} t`;
  $("you-alt").textContent = `${chosen.tonnes.toFixed(1)} t`;
  $("you-save").textContent = `${saved.toFixed(1)} t`;
  $("you-now-note").textContent = "your year, current plate";
  $("you-alt-note").textContent =
    state.mode === "current" ? "same as now" : `${state.mode} year`;
  $("you-save-note").textContent = `${formatInt(drivingKm(saved))} km of driving`;

  const w = worldNow();
  const seconds = (d.current.tonnes / RATES.livestockCo2eTonnesPerYear) * (365.25 * 24 * 3600);
  const veganSeconds = (d.vegan.tonnes / RATES.livestockCo2eTonnesPerYear) * (365.25 * 24 * 3600);
  $("translate").textContent =
    `Your year of eating ≈ ${formatInt(seconds)} seconds of global livestock emissions. A vegan year of your portions ≈ ${formatInt(veganSeconds)} seconds. World so far this year: ${formatInt(w.livestock)} tonnes.`;
}

function wireModals() {
  $("open-sources").addEventListener("click", () => $("sources").classList.add("open"));
  $("close-sources").addEventListener("click", () => $("sources").classList.remove("open"));
  $("sources").addEventListener("click", (e) => {
    if (e.target.id === "sources") $("sources").classList.remove("open");
  });

  $("open-share").addEventListener("click", async () => {
    const d = personal();
    const saved = d.current.tonnes - d.vegan.tonnes;
    const text = `My year of eating: ${d.current.tonnes.toFixed(1)} t CO₂e. If I went vegan: ${d.vegan.tonnes.toFixed(1)} t. That's ${formatInt(drivingKm(saved))} km of driving I wouldn't need to "offset." — The Plate Clock`;
    $("share-text").textContent = text;
    $("share").classList.add("open");
    try {
      await navigator.clipboard.writeText(text);
      $("copied").hidden = false;
    } catch {
      $("copied").hidden = true;
    }
  });
  $("close-share").addEventListener("click", () => $("share").classList.remove("open"));
}

function loop() {
  renderWorld(Date.now());
  requestAnimationFrame(loop);
}

async function main() {
  renderStatic();
  renderPersonal();
  wireModals();
  loop();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    await createGlobe($("globe"), { reducedMotion });
  } catch (err) {
    console.error(err);
    $("loader-text").textContent = "Globe textures blocked — numbers still live";
  }
  $("loader").classList.add("hide");
}

main();
