import {
  RATES,
  COMPARATORS,
  FOODS,
  SOURCES,
  NGOS,
  MEDIA,
  IMPACTS,
  yearProgress,
  dietFootprint,
  formatInt,
} from "./data.js";
import { createGlobe } from "./globe.js";
import { initCountryTable } from "./countries.js";

const $ = (id) => document.getElementById(id);

const state = {
  perWeek: Object.fromEntries(
    Object.entries(FOODS).map(([id, f]) => [id, f.defaultPerWeek])
  ),
  impactId: "climate",
  impactPct: 20,
  harmShown: 0,
  savedShown: 0,
  harmTarget: 0,
  savedTarget: 0,
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

function paintRange(input, max) {
  if (!input) return;
  const ceiling = Number(max ?? input.max) || 100;
  const pct = (Number(input.value) / ceiling) * 100;
  input.style.setProperty("--fill", `${pct}%`);
}

function paintAllRanges(root = document) {
  root.querySelectorAll("input.range").forEach((input) => paintRange(input));
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
      <input class="range" type="range" min="0" max="14" step="1" value="${state.perWeek[id]}" data-food="${id}" />
    `;
    root.appendChild(wrap);
  }
  paintAllRanges(root);
  root.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-food]");
    if (!input) return;
    state.perWeek[input.dataset.food] = Number(input.value);
    const label = root.querySelector(`[data-val="${input.dataset.food}"]`);
    label.textContent = input.value;
    label.classList.remove("pop");
    void label.offsetWidth;
    label.classList.add("pop");
    paintRange(input);
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
  $("you-save-note").innerHTML =
    `Going vegan from this plate saves <span class="num-good">${saved.toFixed(1)} tonnes</span> a year — about <span class="num-good">${formatInt(drivingKm(saved))} km</span> of driving.`;
}

function currentImpact() {
  return IMPACTS.find((item) => item.id === state.impactId) || IMPACTS[0];
}

function impactValue(item, now = Date.now()) {
  if (!item.ticking) return item.yearly;
  return item.yearly * yearProgress(now);
}

function formatImpact(item, value) {
  if (item.id === "rivers") return `${value.toFixed(1)}%`;
  return formatInt(value);
}

function renderImpacts(now = Date.now()) {
  const item = currentImpact();
  const total = impactValue(item, now);
  const prevented = total * (state.impactPct / 100) * item.avoidable;
  const remaining = Math.max(0, total - prevented);
  state.harmTarget = remaining;
  state.savedTarget = prevented;
  $("impact-harm-unit").textContent = item.unit;
  $("impact-saved-unit").textContent = item.unit;
  const share = total === 0 ? 0 : (remaining / total) * 100;
  $("impact-bar-bad").style.width = `${share}%`;
  $("impact-bar-good").style.width = `${100 - share}%`;
  $("impact-copy").innerHTML =
    `<span class="num-bad">${item.harm}</span> <span class="num-good">${item.hope}</span>`;
}

function wireImpacts() {
  const picks = $("impact-picks");
  picks.innerHTML = IMPACTS.map(
    (item) =>
      `<button type="button" data-impact="${item.id}" aria-pressed="${item.id === state.impactId}">${item.label}</button>`
  ).join("");
  picks.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-impact]");
    if (!btn) return;
    state.impactId = btn.dataset.impact;
    for (const b of picks.querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === btn));
    }
    renderImpacts();
  });
  const range = $("impact-range");
  paintRange(range, 100);
  range.addEventListener("input", () => {
    state.impactPct = Number(range.value);
    $("impact-pct").textContent = `${state.impactPct}%`;
    paintRange(range, 100);
    renderImpacts();
  });
}

const IDEA_KEY = "plate-clock-ideas";
const SEED_IDEAS = [
  {
    name: "A visitor",
    kind: "thought",
    message: "I thought recycling was the big climate move. Dinner was hiding in plain sight.",
    at: Date.now() - 86400000,
  },
  {
    name: "Campus kitchen",
    kind: "idea",
    message: "Put these numbers next to the beef and bean burgers in the dining hall.",
    at: Date.now() - 3600000,
  },
];

function loadIdeas() {
  try {
    const saved = JSON.parse(localStorage.getItem(IDEA_KEY) || "[]");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* ignore */
  }
  return [...SEED_IDEAS];
}

function saveIdeas(ideas) {
  localStorage.setItem(IDEA_KEY, JSON.stringify(ideas.slice(0, 40)));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function renderIdeas() {
  const wall = $("idea-wall");
  const ideas = loadIdeas().slice().sort((a, b) => b.at - a.at);
  wall.innerHTML = ideas
    .map(
      (idea) => `
      <article class="idea-card">
        <em>${escapeHtml(idea.kind)} · ${escapeHtml(idea.name || "Anonymous")}</em>
        <p>${escapeHtml(idea.message)}</p>
      </article>`
    )
    .join("");
}

function wireForm() {
  const form = $("idea-form");
  const text = $("idea-text");
  const count = $("idea-count");
  const status = $("idea-status");
  text.addEventListener("input", () => {
    count.textContent = `${text.value.length} / 400`;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = text.value.trim();
    if (message.length < 8) {
      status.hidden = false;
      status.textContent = "Give it a little more — at least a sentence.";
      return;
    }
    const ideas = loadIdeas();
    ideas.push({
      name: $("idea-name").value.trim() || "Anonymous",
      kind: form.kind.value,
      message,
      at: Date.now(),
    });
    saveIdeas(ideas);
    form.reset();
    count.textContent = "0 / 400";
    status.hidden = false;
    status.textContent = "On the wall. Thank you.";
    renderIdeas();
  });
}

function guardImages() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = "./images/forest.jpg";
        }
      },
      { once: true }
    );
  });
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
  const now = Date.now();
  renderWorld(now);
  renderImpacts(now);
  const item = currentImpact();
  state.harmShown += (state.harmTarget - state.harmShown) * 0.14;
  state.savedShown += (state.savedTarget - state.savedShown) * 0.14;
  $("impact-harm").textContent = formatImpact(item, state.harmShown);
  $("impact-saved").textContent = formatImpact(item, state.savedShown);
  requestAnimationFrame(loop);
}

async function main() {
  renderMedia();
  guardImages();
  renderSliders();
  renderPersonal();
  wireImpacts();
  renderImpacts();
  wireShare();
  renderIdeas();
  wireForm();
  reveal();
  loop();
  initCountryTable().then(() => reveal());

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
