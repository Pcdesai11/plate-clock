import { INGREDIENTS, RECIPES } from "./recipes-data.js";

const $ = (id) => document.getElementById(id);

const state = {
  diet: "vegan",
  picked: new Set(),
};

function allowed(recipe) {
  if (state.diet === "vegetarian") return true;
  return recipe.diet === "vegan";
}

function score(recipe) {
  if (!state.picked.size) return 0;
  let hits = 0;
  for (const item of recipe.ingredients) {
    if (state.picked.has(item)) hits += 1;
  }
  return hits;
}

function renderChips() {
  const root = $("chips");
  const hidden = state.diet === "vegan" ? new Set(["eggs", "yogurt"]) : new Set();
  root.innerHTML = INGREDIENTS.filter((name) => !hidden.has(name))
    .map((name) => {
      const on = state.picked.has(name);
      return `<button type="button" class="chip" data-ing="${name}" aria-pressed="${on}">${name}</button>`;
    })
    .join("");
}

function renderRecipes() {
  const list = $("recipe-list");
  const empty = $("recipe-empty");
  const matches = RECIPES.filter(allowed)
    .map((recipe) => ({ recipe, hits: score(recipe) }))
    .filter((row) => (state.picked.size ? row.hits > 0 : true))
    .sort((a, b) => b.hits - a.hits || a.recipe.title.localeCompare(b.recipe.title));

  if (!matches.length) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  list.innerHTML = matches
    .map(({ recipe, hits }, i) => {
      const used = recipe.ingredients.filter((item) => state.picked.has(item));
      return `
        <article class="recipe-card" style="animation-delay:${i * 55}ms">
          <div class="recipe-media">
            <img src="${recipe.image}" alt="" loading="lazy" />
          </div>
          <div class="recipe-body">
            <header>
              <p class="eyebrow">${recipe.diet} · ${recipe.time} · ${recipe.servings} servings${hits ? ` · ${hits} match` : ""}</p>
              <h2>${recipe.title}</h2>
            </header>
            ${used.length ? `<p class="used">Using ${used.join(", ")}</p>` : ""}
            <h3>Ingredients</h3>
            <ul>${recipe.pantry.map((item) => `<li>${item}</li>`).join("")}</ul>
            <h3>Method</h3>
            <ol>${recipe.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
            <p class="why">${recipe.why}</p>
          </div>
        </article>`;
    })
    .join("");

  list.querySelectorAll("img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.src = "./images/food.jpg";
      },
      { once: true }
    );
  });
}

function wire() {
  $("diet-picks").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-diet]");
    if (!btn) return;
    state.diet = btn.dataset.diet;
    if (state.diet === "vegan") {
      state.picked.delete("eggs");
      state.picked.delete("yogurt");
    }
    for (const b of $("diet-picks").querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === btn));
    }
    renderChips();
    renderRecipes();
  });

  $("chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-ing]");
    if (!btn) return;
    const name = btn.dataset.ing;
    if (state.picked.has(name)) state.picked.delete(name);
    else state.picked.add(name);
    renderChips();
    renderRecipes();
  });

  $("clear-ings").addEventListener("click", () => {
    state.picked.clear();
    renderChips();
    renderRecipes();
  });
}

renderChips();
renderRecipes();
wire();
requestAnimationFrame(() => {
  document.getElementById("loader")?.classList.add("hide");
});
