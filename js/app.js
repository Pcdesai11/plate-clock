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
  renderWorld(Date.now());
  requestAnimationFrame(loop);
}

async function main() {
  renderMedia();
  guardImages();
  renderSliders();
  renderPersonal();
  wireShare();
  renderIdeas();
  wireForm();
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
