"""Build livestock points from Climate TRACE + FAO belts, and cache images."""
import json
import random
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
IMAGES = ROOT / "images"
DATA.mkdir(exist_ok=True)
IMAGES.mkdir(exist_ok=True)

UA = {"User-Agent": "PlateClock/1.0 (educational climate visualization)"}


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())


def fetch_climate_trace():
    points = []
    seen = set()
    for offset in range(0, 4000, 100):
        url = (
            "https://api.climatetrace.org/v7/sources"
            f"?year=2025&sectors=agriculture&limit=100&offset={offset}"
        )
        try:
            rows = get_json(url)
        except Exception:
            break
        if not rows:
            break
        for row in rows:
            sub = row.get("subsector") or ""
            kind = None
            if "cattle" in sub:
                kind = "cattle"
            elif sub in ("enteric-fermentation-other", "manure-management-other"):
                kind = "pig"
            if not kind:
                continue
            c = row.get("centroid") or {}
            lat, lon = c.get("latitude"), c.get("longitude")
            if lat is None or lon is None:
                continue
            key = (round(lat, 3), round(lon, 3), kind)
            if key in seen:
                continue
            seen.add(key)
            points.append(
                {
                    "lat": lat,
                    "lon": lon,
                    "kind": kind,
                    "country": row.get("country"),
                    "name": row.get("name"),
                    "src": "climate-trace",
                }
            )
    return points


# FAO-scale herds (million head, ~2022) placed on documented production belts.
BELTS = [
    # country, kind, lat, lon, radius_deg, herd_million
    ("USA", "cattle", 35.2, -101.8, 2.4, 18),
    ("USA", "cattle", 37.6, -100.8, 1.8, 10),
    ("USA", "cattle", 41.1, -100.7, 1.6, 8),
    ("USA", "cattle", 40.4, -103.2, 1.2, 6),
    ("USA", "cattle", 32.4, -99.8, 2.0, 12),
    ("USA", "cattle", 46.8, -100.8, 1.6, 6),
    ("USA", "cattle", 32.8, -83.6, 1.4, 5),
    ("USA", "cattle", 44.5, -100.3, 1.5, 5),
    ("USA", "pig", 42.0, -93.5, 2.0, 24),
    ("USA", "pig", 44.5, -94.5, 1.4, 10),
    ("USA", "pig", 40.3, -89.4, 1.3, 8),
    ("USA", "pig", 35.2, -79.4, 1.4, 9),
    ("USA", "pig", 40.6, -93.0, 1.2, 6),
    ("BRA", "cattle", -12.6, -55.7, 3.2, 40),
    ("BRA", "cattle", -3.4, -52.2, 2.8, 22),
    ("BRA", "cattle", -15.9, -50.1, 2.2, 20),
    ("BRA", "cattle", -18.5, -44.6, 2.0, 25),
    ("BRA", "cattle", -11.2, -62.8, 2.0, 18),
    ("BRA", "cattle", -20.5, -54.6, 2.2, 22),
    ("BRA", "cattle", -5.2, -45.3, 2.0, 12),
    ("BRA", "cattle", -9.0, -56.0, 2.4, 15),
    ("BRA", "pig", -27.6, -51.0, 1.6, 12),
    ("BRA", "pig", -23.5, -51.4, 1.4, 8),
    ("CHN", "cattle", 43.5, 115.0, 3.0, 18),
    ("CHN", "cattle", 30.6, 104.0, 2.0, 12),
    ("CHN", "cattle", 36.6, 101.8, 2.2, 10),
    ("CHN", "cattle", 43.8, 87.6, 2.4, 8),
    ("CHN", "cattle", 47.2, 123.9, 2.0, 8),
    ("CHN", "pig", 30.6, 104.0, 2.2, 55),
    ("CHN", "pig", 33.8, 113.6, 2.0, 50),
    ("CHN", "pig", 27.8, 112.0, 1.8, 40),
    ("CHN", "pig", 36.6, 117.0, 2.0, 45),
    ("CHN", "pig", 23.1, 113.3, 1.6, 30),
    ("CHN", "pig", 32.0, 118.8, 1.6, 28),
    ("CHN", "pig", 28.2, 116.0, 1.6, 22),
    ("CHN", "pig", 45.7, 126.6, 1.8, 18),
    ("IND", "cattle", 26.8, 80.9, 2.4, 50),
    ("IND", "cattle", 26.9, 75.8, 2.2, 40),
    ("IND", "cattle", 23.3, 77.4, 2.0, 35),
    ("IND", "cattle", 21.1, 79.1, 2.0, 28),
    ("IND", "cattle", 22.3, 70.8, 1.8, 22),
    ("IND", "cattle", 16.5, 80.6, 1.8, 20),
    ("IND", "cattle", 11.0, 78.0, 1.6, 18),
    ("IND", "cattle", 30.7, 76.8, 1.4, 16),
    ("ARG", "cattle", -36.2, -60.5, 2.6, 22),
    ("ARG", "cattle", -31.6, -60.7, 1.8, 14),
    ("ARG", "cattle", -27.5, -59.0, 1.6, 8),
    ("AUS", "cattle", -22.5, 144.2, 3.2, 10),
    ("AUS", "cattle", -16.5, 133.4, 2.8, 6),
    ("AUS", "cattle", -32.0, 147.0, 2.2, 5),
    ("MEX", "cattle", 24.8, -102.5, 2.4, 12),
    ("MEX", "cattle", 20.6, -101.0, 1.6, 8),
    ("MEX", "pig", 20.5, -102.5, 1.4, 8),
    ("ETH", "cattle", 9.1, 38.7, 2.8, 28),
    ("ETH", "cattle", 7.0, 38.3, 2.0, 16),
    ("PAK", "cattle", 31.2, 72.3, 2.2, 22),
    ("PAK", "cattle", 27.5, 68.5, 1.8, 12),
    ("NGA", "cattle", 11.8, 8.5, 2.4, 12),
    ("KEN", "cattle", 0.5, 36.3, 2.0, 10),
    ("TZA", "cattle", -6.2, 35.8, 2.2, 12),
    ("COL", "cattle", 7.1, -73.1, 2.0, 12),
    ("COL", "cattle", 4.6, -74.1, 1.6, 8),
    ("FRA", "cattle", 46.6, 2.5, 2.2, 12),
    ("FRA", "pig", 48.3, -1.5, 1.2, 6),
    ("TUR", "cattle", 39.0, 35.2, 2.4, 12),
    ("RUS", "cattle", 54.8, 37.6, 2.0, 8),
    ("RUS", "pig", 55.0, 38.0, 2.0, 10),
    ("CAN", "cattle", 51.0, -113.5, 2.2, 8),
    ("CAN", "pig", 46.8, -71.2, 1.4, 6),
    ("CAN", "pig", 49.8, -97.1, 1.4, 5),
    ("ESP", "pig", 41.6, -0.9, 1.6, 16),
    ("ESP", "pig", 39.5, -0.4, 1.2, 8),
    ("DEU", "pig", 52.5, 8.0, 1.6, 14),
    ("DNK", "pig", 56.2, 9.5, 1.2, 12),
    ("POL", "pig", 52.1, 19.4, 1.6, 8),
    ("NLD", "pig", 51.8, 5.5, 0.8, 8),
    ("VNM", "pig", 21.0, 105.8, 1.4, 12),
    ("VNM", "pig", 10.8, 106.6, 1.2, 10),
    ("PHL", "pig", 15.0, 120.9, 1.4, 8),
    ("KOR", "pig", 36.5, 127.2, 1.2, 8),
    ("THA", "pig", 15.0, 100.5, 1.6, 6),
    ("ZAF", "cattle", -28.5, 25.0, 2.2, 8),
    ("URY", "cattle", -33.0, -56.0, 1.6, 8),
    ("PRY", "cattle", -23.4, -58.4, 2.0, 10),
    ("BOL", "cattle", -16.5, -64.0, 2.0, 7),
    ("NZL", "cattle", -38.0, 175.5, 1.6, 6),
    ("GBR", "cattle", 52.6, -1.5, 1.6, 6),
    ("IRL", "cattle", 53.4, -7.9, 1.2, 6),
]


def jitter_points(belts, rng):
    points = []
    for country, kind, lat, lon, radius, herd in belts:
        n = max(4, int(round(herd / 0.55)))
        for _ in range(n):
            # roughly circular jitter
            u = rng.random()
            v = rng.random()
            r = radius * (u ** 0.5)
            ang = 6.28318530718 * v
            dlat = r * __import__("math").sin(ang)
            dlon = r * __import__("math").cos(ang) / max(0.2, __import__("math").cos(lat * 0.0174533))
            points.append(
                {
                    "lat": lat + dlat,
                    "lon": lon + dlon,
                    "kind": kind,
                    "country": country,
                    "name": f"{country} {kind} belt",
                    "src": "fao-belt",
                }
            )
    return points


IMAGES_TO_FETCH = {
    "cattle.jpg": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=2000&q=80",
    "amazon.jpg": "https://eoimages.gsfc.nasa.gov/images/imagerecords/90000/90671/rondonia_oli_201578.jpg",
    "forest.jpg": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=80",
    "food.jpg": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=2000&q=80",
    "ngo-forest.jpg": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80",
    "ngo-fields.jpg": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80",
    "ngo-woods.jpg": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
    "ngo-wildlife.jpg": "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1400&q=80",
    "ngo-jungle.jpg": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=80",
    "ngo-produce.jpg": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1400&q=80",
    "ngo-earth.jpg": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80",
    "ngo-hens.jpg": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1400&q=80",
    "ngo-herd.jpg": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1400&q=80",
    "ngo-ocean.jpg": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    "earth-nasa.jpg": "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57735/land_ocean_ice_cloud_2048.jpg",
}

FALLBACKS = {
    "amazon.jpg": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=2000&q=80",
    "earth-nasa.jpg": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
}


def download_images():
    ok = {}
    for name, url in IMAGES_TO_FETCH.items():
        dest = IMAGES / name
        urls = [url]
        if name in FALLBACKS:
            urls.append(FALLBACKS[name])
        saved = False
        for candidate in urls:
            try:
                req = urllib.request.Request(candidate, headers=UA)
                with urllib.request.urlopen(req, timeout=40) as r:
                    data = r.read()
                if len(data) < 2000:
                    continue
                dest.write_bytes(data)
                ok[name] = dest.stat().st_size
                saved = True
                break
            except Exception as exc:
                print("fail", name, candidate, exc)
        if not saved:
            print("MISSING", name)
    return ok


def main():
    rng = random.Random(42)
    trace = fetch_climate_trace()
    belts = jitter_points(BELTS, rng)
    points = trace + belts
    kinds = Counter(p["kind"] for p in points)
    srcs = Counter(p["src"] for p in points)
    payload = {
        "source": "Climate TRACE agriculture sources (2025 cattle pasture/operations) plus FAO-weighted cattle and pig production belts.",
        "note": "Dots are farms, feedlots, and slaughter regions — not one animal each.",
        "counts": {"total": len(points), **kinds, **{f"src_{k}": v for k, v in srcs.items()}},
        "points": points,
    }
    out = DATA / "livestock-points.json"
    out.write_text(json.dumps(payload), encoding="utf-8")
    images = download_images()
    print("points", payload["counts"])
    print("images", images)


if __name__ == "__main__":
    main()
