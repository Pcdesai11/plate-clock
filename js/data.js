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

/** Annual harm from animal farming. `avoidable` = share a plant-based shift can prevent. */
export const IMPACTS = [
  {
    id: "climate",
    label: "Climate",
    unit: "tonnes CO₂e this year",
    yearly: 7.1e9,
    ticking: true,
    avoidable: 0.7,
    harm: "Livestock methane, manure, and feed. About 14.5% of all human greenhouse gases.",
    hope: "Most of this disappears if animals leave the plate. Beans do not belch methane.",
    source: "FAO GLEAM",
  },
  {
    id: "animals",
    label: "Animals",
    unit: "land animals killed this year",
    yearly: 83e9,
    ticking: true,
    avoidable: 1,
    harm: "Chickens, pigs, cattle, sheep, goats. Almost all of them exist only to be eaten.",
    hope: "A plant plate ends this number. That is the whole point of the count.",
    source: "FAOSTAT / Our World in Data",
  },
  {
    id: "land",
    label: "Land",
    unit: "hectares held for livestock",
    yearly: 2.7e9,
    ticking: false,
    avoidable: 0.76,
    harm: "About 77% of farming land feeds animals, not people. Pasture plus feed crops.",
    hope: "Poore & Nemecek: dropping animal products can free about three-quarters of farm land.",
    source: "Our World in Data / Poore & Nemecek 2018",
  },
  {
    id: "forest",
    label: "Forest",
    unit: "hectares of tropical primary forest, this year’s pace",
    yearly: 3.7e6,
    ticking: true,
    avoidable: 0.8,
    harm: "Cattle pasture is the leading reason Amazon forest becomes grass.",
    hope: "Leave the beef, and most of this frontier pressure falls.",
    source: "WRI / Global Forest Watch",
  },
  {
    id: "water",
    label: "Water",
    unit: "liters for beef alone this year",
    yearly: 1.08e15,
    ticking: true,
    avoidable: 0.9,
    harm: "About 15,400 liters per kilogram of beef. A year of global beef is a vanished river.",
    hope: "Lentils and tofu use a sliver of that water for the same protein.",
    source: "Mekonnen & Hoekstra / Water Footprint Network",
  },
  {
    id: "rivers",
    label: "Rivers",
    unit: "% of water pollution from food (eutrophication)",
    yearly: 78,
    ticking: false,
    avoidable: 0.49,
    harm: "Manure and fertilizer runoff choke rivers and grow ocean dead zones.",
    hope: "Cutting animal products cuts a large share of that nutrient load.",
    source: "Poore & Nemecek, Science, 2018",
  },
];

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

export const MEDIA = {
  images: {
    amazon: "./images/amazon.jpg",
    forest: "./images/forest.jpg",
    food: "./images/food.jpg",
    cattle: "./images/cattle.jpg",
  },
  videos: [
    {
      id: "nV04zyfLyN4",
      title: "Cowspiracy — official trailer",
      credit: "A.U.M. Films",
    },
    {
      id: "Kl3VVrggKz4",
      title: "Are we the last generation — or the first sustainable one?",
      credit: "Hannah Ritchie / TED / Our World in Data",
    },
  ],
};

export const NGOS = [
  {
    name: "Mighty Earth",
    blurb: "Tracks cattle and soy that drive tropical deforestation.",
    href: "https://www.mightyearth.org/",
    image: "./images/ngo-forest.jpg",
  },
  {
    name: "Global Forest Watch",
    blurb: "See forest loss as it is detected from satellites.",
    href: "https://www.globalforestwatch.org/",
    image: "./images/ngo-jungle.jpg",
  },
  {
    name: "World Resources Institute",
    blurb: "Food, land, and climate research you can act on.",
    href: "https://www.wri.org/food",
    image: "./images/ngo-fields.jpg",
  },
  {
    name: "Rainforest Action Network",
    blurb: "Campaigns to keep forests standing and agribusiness accountable.",
    href: "https://www.ran.org/",
    image: "./images/ngo-woods.jpg",
  },
  {
    name: "WWF",
    blurb: "Wildlife and the lands that feed both people and livestock.",
    href: "https://www.worldwildlife.org/initiatives/food",
    image: "./images/ngo-wildlife.jpg",
  },
  {
    name: "Amazon Conservation",
    blurb: "Protects Amazon habitat on the ground, not only in reports.",
    href: "https://www.amazonconservation.org/",
    image: "./images/amazon.jpg",
  },
  {
    name: "ProVeg International",
    blurb: "Helps people and institutions shift to plant-based food.",
    href: "https://proveg.com/",
    image: "./images/ngo-produce.jpg",
  },
  {
    name: "Plant Based Treaty",
    blurb: "A global call to treat food as climate policy.",
    href: "https://plantbasedtreaty.org/",
    image: "./images/earth-nasa.jpg",
  },
  {
    name: "The Humane League",
    blurb: "Animal protection with a clear path to change what is served.",
    href: "https://thehumaneleague.org/",
    image: "./images/ngo-hens.jpg",
  },
  {
    name: "Mercy For Animals",
    blurb: "Investigates factory farms and funds plant-based alternatives.",
    href: "https://mercyforanimals.org/",
    image: "./images/ngo-herd.jpg",
  },
  {
    name: "Greenpeace",
    blurb: "Forests, oceans, and the industries that put them at risk.",
    href: "https://www.greenpeace.org/international/act/",
    image: "./images/ngo-ocean.jpg",
  },
  {
    name: "Our World in Data",
    blurb: "The food-climate numbers, charted and sourced.",
    href: "https://ourworldindata.org/environmental-impacts-of-food",
    image: "./images/ngo-earth.jpg",
  },
];

export const SOURCES = [
  {
    claim: "Livestock ≈ 7.1 billion tonnes CO₂e / year (14.5% of human GHGs)",
    source: "FAO GLEAM",
    href: "https://www.fao.org/gleam/en/",
  },
  {
    claim: "Food supply chain ≈ 13.7 billion tonnes CO₂e / year (26%)",
    source: "Poore & Nemecek, Science, 2018",
    href: "https://www.science.org/doi/10.1126/science.aaq0216",
  },
  {
    claim: "Per-food footprints (beef 99.5 kg CO₂e / kg, etc.)",
    source: "Poore & Nemecek via Our World in Data",
    href: "https://ourworldindata.org/environmental-impacts-of-food",
  },
  {
    claim: "~83 billion land animals slaughtered / year, ~75 billion chickens",
    source: "FAOSTAT / Our World in Data",
    href: "https://ourworldindata.org/meat-production",
  },
  {
    claim: "Livestock uses ~77% of farming land (~2.7 billion hectares)",
    source: "Our World in Data, agricultural land use",
    href: "https://ourworldindata.org/agricultural-land-by-global-diets",
  },
  {
    claim: "Tropical primary forest loss ~3.7 million ha in a recent year",
    source: "WRI / Global Forest Watch",
    href: "https://www.globalforestwatch.org/",
  },
  {
    claim: "High-meat diet ~10.2 t vs vegan ~2.5 t CO₂e / year (UK)",
    source: "Scarborough et al., Nature Food, 2023",
    href: "https://www.nature.com/articles/s43016-023-00795-w",
  },
  {
    claim: "Driving 0.251 kg CO₂e / km",
    source: "U.S. EPA average passenger vehicle",
    href: "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
  },
  {
    claim: "Red globe dots: Climate TRACE cattle sources + FAO-weighted cattle and pig farm belts",
    source: "Climate TRACE agriculture inventory / FAOSTAT livestock stocks",
    href: "https://climatetrace.org/data",
  },
  {
    claim: "Avoiding animal products can cut food GHG ~49% and farmland ~76%",
    source: "Poore & Nemecek, Science, 2018",
    href: "https://www.science.org/doi/10.1126/science.aaq0216",
  },
  {
    claim: "Beef water footprint ~15,415 liters / kg",
    source: "Mekonnen & Hoekstra, Water Footprint Network",
    href: "https://www.waterfootprint.org/resources/interactive-tools/product-gallery/",
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
