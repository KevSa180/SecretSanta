import { FRIENDS, VILLAGERS, SANTA } from "./data.js";
import DECOR_SIZES from "./decor.json";

/* ---------- sprites de personajes (pixel art generado) ---------- */
export const mk = (fn, w = 16, h = 16) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  fn((col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g);
  return c;
};

function drawChar(r, c, dir, f) {
  const S = [], add = (col, x, y, w, h) => S.push([col, x, y, w, h]);
  const l1 = f === 1 ? 1 : 0, l2 = f === 2 ? 1 : 0, side = dir === "left" || dir === "right";
  add(c.pants, 5, 12 + l1, 3, 3 - l1); add(c.pants, 8, 12 + l2, 3, 3 - l2);
  if (side) { add(c.shirt, 5, 7, 6, 5); add(c.shirt, 6, 8, 4, 3); add(c.skin, 7, 11, 2, 1); }
  else { add(c.shirt, 4, 7, 8, 5); add(c.shirt, 3, 8, 1, 3); add(c.shirt, 12, 8, 1, 3); add(c.skin, 3, 11, 1, 1); add(c.skin, 12, 11, 1, 1); }
  if (c.santa) add("#222", 4, 10, 8, 1);
  add(c.skin, 4, 3, 8, 5);
  if (dir === "down") { add(c.hair, 4, 4, 1, 2); add(c.hair, 11, 4, 1, 2); add("#222", 6, 5, 1, 1); add("#222", 9, 5, 1, 1); }
  if (dir === "up") add(c.hair, 4, 4, 8, 4);
  if (dir === "left") { add(c.hair, 7, 4, 5, 4); add("#222", 5, 5, 1, 1); }
  if (dir === "right") { add(c.hair, 4, 4, 5, 4); add("#222", 10, 5, 1, 1); }
  if (c.santa) {
    if (dir === "down") add("#fff", 5, 6, 6, 3);
    if (dir === "left") add("#fff", 4, 6, 4, 3);
    if (dir === "right") add("#fff", 8, 6, 4, 3);
    if (dir === "up") add("#fff", 4, 7, 8, 1);
  }
  add(c.hat, 5, 1, 6, 1); add(c.hat, 4, 2, 8, 1); add("#fff", 4, 3, 8, 1);
  const px = dir === "right" || dir === "up" ? 2 : 11;
  add("#fff", px, 0, 2, 2);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) for (const [, x, y, w, h] of S) r("#1f1f2e", x + dx, y + dy, w, h);
  for (const [col, x, y, w, h] of S) r(col, x, y, w, h);
}

const load = src => { const i = new Image(); i.src = src; return i; };
function prep(p) {
  if (p.sheet) { p.sheetImg = load(p.sheet); p.portraitImg = load(p.portrait); return; }
  p.spr = {};
  for (const d of ["down", "up", "left", "right"]) p.spr[d] = [0, 1, 2].map(f => mk(r => drawChar(r, p, d, f)));
}
[...FRIENDS, ...VILLAGERS, SANTA].forEach(prep);

/* ---------- tiles (pixel art) ---------- */
export const TILES = {};
const snowBase = r => r("#eef3fb", 0, 0, 16, 16);
const shadow = r => r("rgba(110,130,170,.35)", 2, 13, 12, 2);
TILES.snow = [0, 1, 2].map(v => mk(r => {
  snowBase(r);
  [[[3, 4], [11, 9], [6, 13]], [[12, 3], [5, 8], [9, 14]], [[2, 11], [10, 5], [14, 13]]][v]
    .forEach(([x, y]) => { r("#d3e0f3", x, y, 2, 1); r("#fff", x, y - 1, 1, 1); });
}));
TILES[","] = mk(r => {
  r("#d9bb8f", 0, 0, 16, 16);
  r("#bf9c6c", 0, 0, 16, 1); r("#bf9c6c", 0, 8, 16, 1);
  r("#bf9c6c", 0, 0, 1, 8); r("#bf9c6c", 8, 0, 1, 8); r("#bf9c6c", 4, 8, 1, 8); r("#bf9c6c", 12, 8, 1, 8);
  r("#e8d1ac", 2, 2, 4, 1); r("#e8d1ac", 10, 10, 4, 1);
});
TILES.T = mk(r => {
  snowBase(r); shadow(r);
  r("#6b4423", 7, 12, 2, 3);
  r("#1c6b3a", 2, 9, 12, 3); r("#1c6b3a", 3, 6, 10, 3); r("#1c6b3a", 5, 3, 6, 3); r("#1c6b3a", 6, 1, 4, 2);
  r("#2e8f54", 8, 9, 6, 2); r("#2e8f54", 8, 6, 5, 2); r("#2e8f54", 8, 3, 3, 2);
  r("#fff", 3, 9, 3, 1); r("#fff", 5, 6, 3, 1); r("#fff", 6, 3, 2, 1); r("#fff", 7, 1, 2, 1);
  r("#ff4d4d", 4, 10, 1, 1); r("#ffd54a", 9, 7, 1, 1); r("#4aa8ff", 7, 4, 1, 1); r("#ffd54a", 11, 10, 1, 1);
});
TILES.r = mk(r => {
  r("#b8312f", 0, 0, 16, 16);
  [4, 8, 12].forEach(y => r("#8e2423", 0, y, 16, 1));
  r("#8e2423", 4, 1, 1, 3); r("#8e2423", 12, 1, 1, 3); r("#8e2423", 8, 5, 1, 3); r("#8e2423", 0, 5, 1, 3);
  r("#8e2423", 4, 9, 1, 3); r("#8e2423", 12, 9, 1, 3);
  r("#fff", 0, 0, 16, 3); r("#e4ecf7", 0, 3, 16, 1); r("#fff", 2, 3, 3, 1); r("#fff", 9, 3, 4, 1);
  r("#5e1716", 0, 14, 16, 2);
});
const wall = r => { r("#f3e3c3", 0, 0, 16, 16); [5, 10, 15].forEach(y => r("#dcc79e", 0, y, 16, 1)); };
TILES.w = mk(r => wall(r));
TILES.h = mk(r => {
  wall(r);
  r("#7a4a28", 3, 2, 10, 10); r("#ffe27a", 4, 3, 8, 8); r("#7a4a28", 7, 3, 2, 8); r("#7a4a28", 4, 6, 8, 1);
  r("#fff6c0", 4, 3, 3, 3); r("#fff", 2, 12, 12, 1);
});
TILES.d = mk(r => {
  wall(r);
  r("#6b3f1f", 3, 1, 10, 15); r("#7a4a28", 4, 2, 8, 14);
  r("#2f8f50", 6, 4, 4, 4); r("#7a4a28", 7, 5, 2, 2); r("#ff4d4d", 7, 8, 2, 1);
  r("#ffd54a", 10, 10, 1, 2); r("#c0392b", 3, 15, 10, 1);
});
TILES.l = mk(r => {
  snowBase(r); shadow(r);
  r("rgba(255,213,74,.28)", 2, 0, 12, 9);
  r("#2f3040", 7, 6, 2, 9); r("#2f3040", 6, 14, 4, 1);
  r("#2f3040", 5, 1, 6, 1); r("#ffd54a", 5, 2, 6, 4); r("#fff6c0", 6, 3, 4, 2); r("#2f3040", 5, 6, 6, 1);
});
TILES.g = mk(r => {
  snowBase(r); shadow(r);
  r("#c0392b", 1, 7, 8, 8); r("#ffd54a", 4, 7, 2, 8); r("#ffd54a", 1, 10, 8, 2); r("#ffd54a", 3, 5, 2, 2); r("#ffd54a", 5, 5, 2, 2);
  r("#2e8b57", 9, 10, 6, 5); r("#fff", 11, 10, 2, 5); r("#fff", 9, 12, 6, 1); r("#fff", 11, 8, 2, 2);
});
TILES.t = mk(r => {
  snowBase(r); shadow(r);
  r("#7a4a28", 1, 13, 2, 3); r("#7a4a28", 13, 13, 2, 3);
  r("#c0392b", 0, 6, 16, 8); r("#a02a22", 0, 9, 16, 1); r("#fff", 0, 6, 16, 1);
  r("#fff", 0, 13, 4, 1); r("#fff", 8, 13, 4, 1);
  r("#f8c8dc", 3, 3, 7, 3); r("#fff", 3, 3, 7, 1); r("#4aa8ff", 6, 1, 1, 2); r("#ffd54a", 6, 0, 1, 1);
  r("#fff", 12, 3, 2, 3); r("#e74c3c", 12, 3, 2, 1);
});
const balloon = (r, col, x, y, w, h) => { r(col, x + 1, y, w - 2, h); r(col, x, y + 1, w, h - 2); r("rgba(255,255,255,.65)", x + 1, y + 1, 1, 2); };
TILES.b = mk(r => {
  snowBase(r);
  r("#8a8a9a", 4, 9, 1, 7); r("#8a8a9a", 12, 8, 1, 8); r("#8a8a9a", 8, 12, 1, 4);
  balloon(r, "#e74c3c", 1, 2, 6, 7); balloon(r, "#ffd54a", 9, 1, 6, 7); balloon(r, "#4aa8ff", 5, 5, 6, 7);
  r("#c0392b", 6, 14, 4, 2);
});
TILES.s = mk(r => {
  snowBase(r); shadow(r);
  r("#fff", 4, 8, 8, 7); r("#fff", 3, 9, 10, 5); r("#fff", 5, 3, 6, 6); r("#cfdcf0", 3, 12, 1, 2); r("#cfdcf0", 12, 12, 1, 2);
  r("#222", 6, 5, 1, 1); r("#222", 9, 5, 1, 1); r("#ff8c1a", 7, 6, 3, 1);
  r("#c0392b", 5, 8, 6, 2); r("#c0392b", 9, 10, 2, 3);
  r("#222", 8, 11, 1, 1); r("#222", 8, 13, 1, 1);
  r("#c0392b", 5, 0, 6, 2); r("#fff", 5, 2, 6, 1); r("#fff", 10, 0, 2, 2);
});
TILES.f = mk(r => {
  snowBase(r);
  r("#8b5a2b", 2, 5, 2, 10); r("#8b5a2b", 12, 5, 2, 10);
  r("#a06a35", 0, 7, 16, 2); r("#a06a35", 0, 11, 16, 2);
  r("#fff", 0, 6, 16, 1); r("#fff", 2, 4, 2, 1); r("#fff", 12, 4, 2, 1);
});

/* árbol navideño gigante 32x32 */
export const BIGTREE = mk(r => {
  r("#6b4423", 14, 27, 4, 5);
  for (let y = 4; y < 28; y++) {
    const tier = Math.floor((y - 4) / 8), w = Math.min(30, 4 + (y - 4 - tier * 8) * 2 + tier * 6 + 2);
    const x = 16 - w / 2;
    r("#1c6b3a", x, y, w, 1); r("#2e8f54", 16, y, w / 2, 1);
    if ((y - 4) % 8 === 0) r("#fff", x, y, Math.max(2, w / 3), 1);
  }
  r("#c0392b", 3, 28, 5, 4); r("#ffd54a", 5, 28, 1, 4); r("#3b82f6", 24, 29, 5, 3); r("#fff", 26, 29, 1, 3);
  r("#ffd54a", 15, 0, 3, 3); r("#ffd54a", 14, 1, 5, 1);
}, 32, 32);
export const TREE_LIGHTS = [[16, 8], [12, 10], [20, 10], [10, 15], [16, 14], [22, 15], [7, 22], [13, 21], [19, 23], [25, 22], [16, 19], [9, 26]];
export const TREE_X = 14, TREE_Y = 9;

/* ---------- decoración y renos (PNG en public/sprites) ---------- */
export const DECOR_IMGS = Object.fromEntries(
  Object.entries(DECOR_SIZES).map(([name, { w, h }]) => [name, { img: load(`/sprites/deco/${name}.png`), w, h }])
);
export const REINDEER = { name: "Reno", deer: true, sheetImg: load("/sprites/reindeer.png") };
