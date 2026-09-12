/** Published rates — animated in real time, not farm sensors. */
export const RATES = {
  livestockCo2eTonnesPerYear: 7.1e9,
  foodSystemCo2eTonnesPerYear: 13.7e9,
  landAnimalsSlaughteredPerYear: 83e9,
  chickensSlaughteredPerYear: 75e9,
  cattleSlaughteredPerYear: 3.0e8,
  tropicalPrimaryForestHaPerYear: 3.7e6,
  livestockLandHa: 2.7e9,
};

export const COMPARATORS = {
  kgCo2ePerKmDriving: 0.251,
  tonnesPerNycLondonFlight: 0.9,
};

export const FOODS = {
  beef: {
    label: "Beef",
    unit: "servings / week",
    kgCo2ePerKg: 99.48,
    servingKg: 0.1,
    landM2PerKg: 326.21,
    defaultPerWeek: 3,
    animal: true,
    meat: true,
  },
  chicken: {
    label: "Chicken",
    unit: "servings / week",
    kgCo2ePerKg: 9.87,
    servingKg: 0.12,
    landM2PerKg: 12.22,
    defaultPerWeek: 4,
    animal: true,
    meat: true,
  },
  pork: {
    label: "Pork",
    unit: "servings / week",
    kgCo2ePerKg: 12.31,
    servingKg: 0.12,
    landM2PerKg: 17.36,
    defaultPerWeek: 2,
    animal: true,
    meat: true,
  },
  fish: {
    label: "Fish",
    unit: "servings / week",
    kgCo2ePerKg: 13.63,
    servingKg: 0.14,
    landM2PerKg: 8.41,
    defaultPerWeek: 1,
    animal: true,
    meat: true,
  },
  cheese: {
    label: "Cheese",
    unit: "servings / week",
    kgCo2ePerKg: 23.88,
    servingKg: 0.04,
    landM2PerKg: 87.79,
    defaultPerWeek: 4,
    animal: true,
    meat: false,
  },
  milk: {
    label: "Milk",
    unit: "glasses / week",
    kgCo2ePerKg: 3.15,
    servingKg: 0.2,
    landM2PerKg: 8.95,
    defaultPerWeek: 7,
    animal: true,
    meat: false,
  },
  eggs: {
    label: "Eggs",
    unit: "pairs / week",
    kgCo2ePerKg: 4.67,
    servingKg: 0.1,
    landM2PerKg: 6.27,
    defaultPerWeek: 3,
    animal: true,
    meat: false,
  },
};

export const HOTSPOTS = [
  { name: "Amazon cattle frontier", lat: -3.2, lon: -62.1, kind: "forest" },
  { name: "Cerrado pasture", lat: -14.8, lon: -52.2, kind: "forest" },
  { name: "Gran Chaco", lat: -22.4, lon: -60.5, kind: "forest" },
  { name: "U.S. feedlot belt", lat: 36.4, lon: -101.2, kind: "livestock" },
  { name: "Queensland cattle", lat: -22.5, lon: 144.2, kind: "livestock" },
];

export const SOURCES = [
  {
    claim: "Livestock ≈ 7.1 billion tonnes CO₂e / year (14.5% of human GHGs)",
    source: "FAO GLEAM",
  },
  {
    claim: "Food supply chain ≈ 13.7 billion tonnes CO₂e / year (26%)",
    source: "Poore & Nemecek, Science, 2018",
  },
  {
    claim: "Per-food footprints (beef 99.5 kg CO₂e / kg, etc.)",
    source: "Poore & Nemecek via Our World in Data",
  },
  {
    claim: "~83 billion land animals slaughtered / year, ~75 billion chickens",
    source: "FAOSTAT / Our World in Data",
  },
  {
    claim: "Livestock uses ~77% of farming land (~2.7 billion hectares)",
    source: "Our World in Data, agricultural land use",
  },
  {
    claim: "Tropical primary forest loss ~3.7 million ha in a recent year",
    source: "WRI / Global Forest Watch",
  },
  {
    claim: "High-meat diet ~10.2 t vs vegan ~2.5 t CO₂e / year (UK)",
    source: "Scarborough et al., Nature Food, 2023",
  },
  {
    claim: "Driving 0.251 kg CO₂e / km",
    source: "U.S. EPA average passenger vehicle",
  },
  {
    claim: "Globe lighting uses the real sun position for this moment",
    source: "Approximate solar declination + UTC hour angle",
  },
];

export function msThisYear(now = Date.now()) {
  const d = new Date(now);
  return now - Date.UTC(d.getUTCFullYear(), 0, 1);
}

export function msPerYear(now = Date.now()) {
  const y = new Date(now).getUTCFullYear();
  return Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1);
}

export function yearProgress(now = Date.now()) {
  return msThisYear(now) / msPerYear(now);
}

export function dietFootprint(perWeek, mode = "current") {
  let tonnes = 0;
  let landM2 = 0;
  for (const [id, food] of Object.entries(FOODS)) {
    let n = perWeek[id] ?? food.defaultPerWeek;
    if (mode === "nobeef" && id === "beef") n = 0;
    if (mode === "vegetarian" && food.meat) n = 0;
    if (mode === "vegan" && food.animal) n = 0;
    const kg = n * food.servingKg * 52;
    tonnes += (kg * food.kgCo2ePerKg) / 1000;
    landM2 += kg * food.landM2PerKg;
  }
  return { tonnes, landM2 };
}

export function formatInt(n) {
  return Math.round(n).toLocaleString("en-US");
}

export function formatTonnes(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(3)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} million`;
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

export function formatCompact(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(3);
  if (n >= 1e6) return (n / 1e6).toFixed(2);
  return Math.round(n).toLocaleString("en-US");
}

export function compactSuffix(n) {
  if (n >= 1e9) return "billion";
  if (n >= 1e6) return "million";
  return "";
}

export function formatClock(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(s % 60).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  if (h) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}
