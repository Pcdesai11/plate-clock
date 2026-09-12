import {
  RATES,
  COMPARATORS,
  FOODS,
  SOURCES,
  NGOS,
  MEDIA,
  yearProgress,
  dietFootprint,
  formatInt,
} from "./data.js";
import { createGlobe } from "./globe.js";

const $ = (id) => document.getElementById(id);

const state = {
  perWeek: Object.fromEntries(
    Object.entries(FOODS).map(([id, f]) => [id, f.defaultPerWeek])
  ),
};

function worldNow(now = Date.now()) {
  const p = yearProgress(now);
  return {
    livestock: RATES.livestockCo2eTonnesPerYear * p,
    animals: RATES.landAnimalsSlaughteredPerYear * p,
    cattle: RATES.cattleSlaughteredPerYear * p,
    forest: RATES.tropicalPrimaryForestHaPerYear * p,
  };
}

function drivingKm(tonnes) {
  return (tonnes * 1000) / COMPARATORS.kgCo2ePerKmDriving;
}

function renderMedia() {
  $("img-cattle").src = MEDIA.images.cattle;
  $("img-amazon").src = MEDIA.images.amazon;
  $("img-forest").src = MEDIA.images.forest;
  $("img-food").src = MEDIA.images.food;

  $("videos").innerHTML = MEDIA.videos
    .map(
      (v) => `
      <figure>
        <div class="video">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${v.id}"
            title="${v.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        <p>${v.title} · ${v.credit}</p>
      </figure>`
    )
    .join("");

  $("ngos").innerHTML = NGOS.map(
    (n) => `
    <a class="ngo reveal" href="${n.href}" target="_blank" rel="noopener noreferrer">
      <img src="${n.image}" alt="" />
      <div>
        <strong>${n.name}</strong>
        <span>${n.blurb}</span>
        <em>Visit ${n.name} →</em>
      </div>
    </a>`
  ).join("");

  $("source-list").innerHTML = SOURCES.map(
    (s) =>
      `<li>${s.claim}<br><a href="${s.href}" target="_blank" rel="noopener noreferrer">${s.source}</a></li>`
  ).join("");
}

function renderSliders() {
  const root = $("sliders");
  root.innerHTML = "";
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
    root.appendChild(wrap);
  }
  root.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-food]");
    if (!input) return;
    state.perWeek[input.dataset.food] = Number(input.value);
    root.querySelector(`[data-val="${input.dataset.food}"]`).textContent = input.value;
    renderPersonal();
  });
}

function renderWorld(now) {
  const w = worldNow(now);
  $("livestock-num").textContent = formatInt(w.livestock);
  $("animals-num").textContent = formatInt(w.animals);
  $("cattle-num").textContent = formatInt(w.cattle);
  $("forest-num").textContent = formatInt(w.forest);
}

function renderPersonal() {
  const now = dietFootprint(state.perWeek, "current");
  const veg = dietFootprint(state.perWeek, "vegetarian");
  const vegan = dietFootprint(state.perWeek, "vegan");
  const saved = Math.max(0, now.tonnes - vegan.tonnes);
  $("you-now").textContent = `${now.tonnes.toFixed(1)} t`;
  $("you-veg").textContent = `${veg.tonnes.toFixed(1)} t`;
  $("you-vegan").textContent = `${vegan.tonnes.toFixed(1)} t`;
  $("you-save-note").textContent =
    `Going vegan from this plate saves ${saved.toFixed(1)} tonnes a year — about ${formatInt(drivingKm(saved))} km of driving.`;
}

function wireShare() {
  $("share-btn").addEventListener("click", async () => {
    const now = dietFootprint(state.perWeek, "current");
    const vegan = dietFootprint(state.perWeek, "vegan");
    const saved = now.tonnes - vegan.tonnes;
    const text = `My year of eating is ${now.tonnes.toFixed(1)} t CO₂e. Vegan: ${vegan.tonnes.toFixed(1)} t. That gap is ${formatInt(drivingKm(saved))} km of driving. plate-clock.vercel.app`;
    try {
      await navigator.clipboard.writeText(text);
      $("copied").hidden = false;
    } catch {
      $("copied").hidden = true;
    }
  });
}

function reveal() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("in");
      }
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

function loop() {
  renderWorld(Date.now());
  requestAnimationFrame(loop);
}

async function main() {
  renderMedia();
  renderSliders();
  renderPersonal();
  wireShare();
  reveal();
  loop();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    await createGlobe($("globe"), { reducedMotion });
  } catch (err) {
    console.error(err);
    $("loader-text").textContent = "Numbers still live";
  }
  $("loader").classList.add("hide");
}

main();
