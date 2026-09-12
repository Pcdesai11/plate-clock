/** Interactive country meat-consumption table. */

const tableState = {
  rows: [],
  max: 1,
  median: 0,
  query: "",
  sort: "high",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

function intensity(kg, max) {
  const t = Math.min(1, kg / max);
  // pale → bright red
  const r = 255;
  const g = Math.round(220 - t * 200);
  const b = Math.round(220 - t * 200);
  return `rgb(${r},${g},${b})`;
}

function level(kg, median) {
  if (kg >= median * 1.4) return { label: "Very high", cls: "lvl-high" };
  if (kg >= median) return { label: "Above median", cls: "lvl-mid" };
  if (kg >= median * 0.5) return { label: "Below median", cls: "lvl-low" };
  return { label: "Among the lowest", cls: "lvl-best" };
}

function filtered() {
  const q = tableState.query.trim().toLowerCase();
  let rows = tableState.rows;
  if (q) {
    rows = rows.filter(
      (r) =>
        r.country.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
    );
  }
  const sorted = [...rows];
  if (tableState.sort === "high") sorted.sort((a, b) => b.kg - a.kg);
  else if (tableState.sort === "low") sorted.sort((a, b) => a.kg - b.kg);
  else sorted.sort((a, b) => a.country.localeCompare(b.country));
  return sorted;
}

function renderTable() {
  const body = document.getElementById("country-body");
  const meta = document.getElementById("country-meta");
  if (!body) return;
  const rows = filtered();
  const ranked = [...tableState.rows].sort((a, b) => b.kg - a.kg);
  const rankOf = new Map(ranked.map((r, i) => [r.code, i + 1]));

  meta.textContent = rows.length
    ? `${rows.length} countries · kilograms of meat per person per year · FAO / Our World in Data`
    : "No country matches that search.";

  body.innerHTML = rows
    .map((r) => {
      const pct = Math.max(2, (r.kg / tableState.max) * 100);
      const lvl = level(r.kg, tableState.median);
      const vs = (r.kg / tableState.median).toFixed(1);
      return `
        <tr class="${lvl.cls}" tabindex="0">
          <td class="rank">#${rankOf.get(r.code)}</td>
          <td class="nation">
            <strong>${escapeHtml(r.country)}</strong>
            <span>${escapeHtml(r.code)} · ${r.year}</span>
          </td>
          <td class="kg">
            <b style="color:${intensity(r.kg, tableState.max)}">${r.kg.toFixed(1)}</b>
            <em>kg / person</em>
          </td>
          <td class="bar-cell">
            <div class="meat-bar" aria-hidden="true">
              <i style="width:${pct}%; background:${intensity(r.kg, tableState.max)}"></i>
            </div>
            <span class="vs">${vs}× the median · ${lvl.label}</span>
          </td>
        </tr>`;
    })
    .join("");
}

function wireTable() {
  const search = document.getElementById("country-search");
  const sorts = document.getElementById("country-sorts");
  if (!search || !sorts) return;

  search.addEventListener("input", () => {
    tableState.query = search.value;
    renderTable();
  });

  sorts.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sort]");
    if (!btn) return;
    tableState.sort = btn.dataset.sort;
    for (const b of sorts.querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === btn));
    }
    renderTable();
  });
}

function fillSpotlight(rows) {
  const top = rows[0];
  const usa = rows.find((r) => r.code === "USA");
  const ind = rows.find((r) => r.code === "IND");
  const low = rows[rows.length - 1];
  const spot = document.getElementById("country-spot");
  if (!spot || !top) return;
  spot.innerHTML = `
    <div>
      <em>Highest</em>
      <strong class="num-bad">${escapeHtml(top.country)}</strong>
      <span class="num-bad">${top.kg.toFixed(1)} kg</span>
    </div>
    <div>
      <em>United States</em>
      <strong class="num-bad">${usa ? usa.kg.toFixed(1) : "—"} kg</strong>
      <span>${usa && ind ? `${(usa.kg / ind.kg).toFixed(0)}× India` : ""}</span>
    </div>
    <div>
      <em>Lowest</em>
      <strong class="num-good">${escapeHtml(low.country)}</strong>
      <span class="num-good">${low.kg.toFixed(1)} kg</span>
    </div>`;
}

export async function initCountryTable() {
  try {
    const res = await fetch("./data/meat-consumption.json");
    const data = await res.json();
    const rows = data.countries || [];
    const sorted = [...rows].sort((a, b) => b.kg - a.kg);
    const mid = sorted[Math.floor(sorted.length / 2)]?.kg || 40;
    tableState.rows = sorted;
    tableState.max = data.max || sorted[0]?.kg || 1;
    tableState.median = mid;
    fillSpotlight(sorted);
    wireTable();
    renderTable();
  } catch (err) {
    console.error(err);
    const meta = document.getElementById("country-meta");
    if (meta) meta.textContent = "Could not load country data.";
  }
}
