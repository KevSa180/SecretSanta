/* ---------- mapa ---------- */
export const T = 16, MW = 30, MH = 20;

export const map = Array.from({ length: MH }, () => Array(MW).fill("."));
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y][x] = c; };
const putIf = (x, y, c) => { if (map[y] && map[y][x] === ".") map[y][x] = c; };
const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c); };
for (let x = 0; x < MW; x++) { put(x, 0, "T"); put(x, MH - 1, "T"); }
for (let y = 0; y < MH; y++) { put(0, y, "T"); put(MW - 1, y, "T"); }
rect(14, 1, 15, 18, ",");            // calle central
rect(4, 5, 4, 9, ","); rect(4, 9, 13, 9, ",");
rect(25, 5, 25, 9, ","); rect(15, 9, 25, 9, ",");
rect(4, 17, 25, 17, ",");           // calle de abajo
rect(9, 6, 20, 13, ",");            // plaza
export const DOORS = [];   // casilla de la puerta de cada casa
const house = (x, y) => { DOORS.push([x + 1, y + 2]); rect(x, y, x + 2, y, "r"); put(x, y + 1, "h"); put(x + 1, y + 1, "w"); put(x + 2, y + 1, "h"); put(x, y + 2, "w"); put(x + 1, y + 2, "d"); put(x + 2, y + 2, "w"); };
house(3, 2); house(24, 2); house(3, 14); house(24, 14);
rect(14, 9, 15, 10, "X");
[[11, 7], [12, 7], [17, 7], [18, 7], [11, 12], [12, 12], [17, 12], [18, 12]].forEach(([x, y]) => put(x, y, "t"));
[[10, 7], [19, 7], [10, 12], [19, 12]].forEach(([x, y]) => put(x, y, "b"));
[[9, 6], [20, 6], [9, 13], [20, 13]].forEach(([x, y]) => put(x, y, "g"));
[[9, 8], [9, 11], [20, 8], [20, 11], [13, 3], [16, 3], [13, 6], [16, 6], [8, 16], [21, 16]].forEach(([x, y]) => put(x, y, "l"));
[[7, 10], [22, 10], [6, 3], [23, 14]].forEach(([x, y]) => put(x, y, "s"));
for (let x = 2; x <= 7; x++) if (x !== 4) { put(x, 7, "f"); put(x, 12, "f"); }
for (let x = 22; x <= 27; x++) if (x !== 25) { put(x, 7, "f"); put(x, 12, "f"); }
[[8, 2], [9, 3], [7, 4], [20, 2], [21, 3], [22, 4], [2, 10], [2, 11], [27, 10], [27, 11], [8, 15], [9, 16], [20, 15], [21, 16], [11, 18], [17, 18], [6, 13], [3, 8], [26, 8]]
  .forEach(([x, y]) => putIf(x, y, "T"));
for (let x = 1; x < MW - 1; x++) { if ((x * 7) % 5 < 2) putIf(x, 1, "T"); if ((x * 11) % 5 < 2) putIf(x, MH - 2, "T"); }

const SOLID = new Set("TrwhdlgftbsX".split(""));
const blocked = new Set();   // casillas ocupadas por decoración
export const solidAt = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || SOLID.has(map[y][x]) || blocked.has(y * MW + x);

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPP = { up: "down", down: "up", left: "right", right: "left" };

export function bfs(sx, sy) {
  const d = Array.from({ length: MH }, () => Array(MW).fill(-1)); d[sy][sx] = 0;
  const q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const k in DIRS) {
      const nx = x + DIRS[k][0], ny = y + DIRS[k][1];
      if (!solidAt(nx, ny) && d[ny][nx] < 0) { d[ny][nx] = d[y][x] + 1; q.push([nx, ny]); }
    }
  }
  return d;
}

/* ---------- decoración repartida por el pueblo ---------- */
const DECOR_KINDS = {
  tree: ["tree-big", "tree-a", "tree-b", "tree-c", "tree-d"],
  snowman: ["snowman-a", "snowman-b", "snowman-big", "snowman-small"],
  gift: ["gift-blue-big", "gift-yellow-big", "gift-orange-big", "gift-orange", "gift-green", "gift-cyan", "gift-gold", "gift-red", "gift-blue"],
};
export const DECOR = [];   // { kind, tx, ty }

(function placeDecor() {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const reach = () => bfs(14, 18).flat().filter(v => v >= 0).length;
  const free = (x, y) => map[y][x] === "." && !blocked.has(y * MW + x);
  const nearRoad = (x, y) => [-1, 0, 1].some(dy => [-1, 0, 1].some(dx => map[y + dy]?.[x + dx] === ","));
  const nearDoor = (x, y) => DOORS.some(([dx, dy]) => Math.abs(x - dx) <= 1 && y >= dy && y <= dy + 3);
  const crowded = (x, y) => DECOR.some(d => Math.abs(d.tx - x) < 3 && Math.abs(d.ty - y) < 2);
  const plan = [["tree", 9], ["snowman", 6], ["gift", 14]];
  for (const [type, count] of plan) {
    const kinds = DECOR_KINDS[type];
    for (let n = 0, tries = 0; n < count && tries < 600; tries++) {
      const x = 1 + Math.floor(rand() * (MW - 2)), y = 2 + Math.floor(rand() * (MH - 3));
      if (!free(x, y) || nearRoad(x, y) || nearDoor(x, y) || crowded(x, y)) continue;
      const before = reach();
      blocked.add(y * MW + x);
      if (reach() < before - 1) { blocked.delete(y * MW + x); continue; }   // no encerrar zonas
      DECOR.push({ kind: kinds[Math.floor(rand() * kinds.length)], tx: x, ty: y });
      n++;
    }
  }
})();

/* ---------- puntos de referencia (para las pistas sobre dónde está Santa) ---------- */
const DECOR_LABEL = kind => {
  if (kind.startsWith("snowman")) return "un muñeco de nieve";
  if (kind.startsWith("tree")) return "un arbolito";
  const color = { "gift-blue-big": "azul", "gift-blue": "azul", "gift-yellow-big": "amarillo", "gift-gold": "amarillo",
    "gift-orange-big": "naranja", "gift-orange": "naranja", "gift-green": "rojo", "gift-red": "rojo", "gift-cyan": "turquesa" }[kind];
  return `un regalo ${color}`;
};
const TILE_LABEL = { r: "una casa", h: "una casa", w: "una casa", d: "una casa", l: "un farol", t: "una mesa de postres",
  b: "unos globos", g: "unos regalos de la plaza", s: "un muñeco de nieve", X: "el árbol de navidad gigante" };

/** Todos los puntos de referencia (sin repetir) a `max` casillas o menos de (x, y). Las cercas nunca cuentan. */
export function landmarksNear(x, y, max) {
  const found = new Set();
  const consider = (label, dist) => { if (dist > 0 && dist <= max) found.add(label); };
  DECOR.forEach(d => consider(DECOR_LABEL(d.kind), Math.abs(d.tx - x) + Math.abs(d.ty - y)));
  for (let yy = Math.max(0, y - max); yy <= Math.min(MH - 1, y + max); yy++)
    for (let xx = Math.max(0, x - max); xx <= Math.min(MW - 1, x + max); xx++)
      if (TILE_LABEL[map[yy][xx]]) consider(TILE_LABEL[map[yy][xx]], Math.abs(xx - x) + Math.abs(yy - y));
  return [...found];
}
