import { FRIENDS, VILLAGERS, SANTA, DEER_MESSAGES } from "./data.js";
import { TILES, DECOR_IMGS, REINDEER, BIGTREE, TREE_LIGHTS, TREE_X, TREE_Y } from "./art.js";
import { sorteoPara } from "./sorteo.js";
import { T, MW, MH, map, DECOR, landmarksNear, solidAt, DIRS, OPP, DOORS, bfs } from "./map.js";

export const H = 160, BASE_W = 240, MAX_W = 420;   // el ancho se adapta a la pantalla (entre BASE_W y MAX_W)
const FONT = "8px 'Press Start 2P', monospace", BIG = "16px 'Press Start 2P', monospace";
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEER_ROW = { right: 0, left: 1, up: 2, down: 2 };
const SPR_W = 32, SPR_H = 44, PORTRAIT_W = 96, PORTRAIT_H = 132, DIR_ROW = { down: 0, up: 1, left: 2, right: 3 };
const STARS = Array.from({ length: 56 }, (_, i) => [(i * 83) % MAX_W, (i * 47) % 100, i]);

/* ---------- audio (bips estilo consola) ---------- */
let ac;
function beep(f = 660, d = .05, v = .04) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "square"; o.frequency.value = f; g.gain.value = v;
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  } catch { /* sin audio */ }
}

function wrap(s, n = 26) {
  const out = []; let line = "";
  for (const w of s.split(" ")) {
    if ((line + " " + w).trim().length > n) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}
/**
 * Crea el juego sobre un <canvas>. Devuelve la entrada (para el D-pad táctil)
 * y destroy() para limpiar listeners y el loop (necesario con React StrictMode).
 */
export function createGame(cv, onUi = () => {}) {
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  let W = BASE_W;
  const OX = () => Math.floor((W - BASE_W) / 2);   // las pantallas diseñadas para 240 px se centran
  const touch = matchMedia("(pointer: coarse)").matches;
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  /* ---------- estado ---------- */
  let mode = "title", me, player, ents = [], santaEnt, santaDist, santaHints, target, targetNick;
  let dlg = null, menu = null, cut = null, talkTarget = null, camX = 0, camY = 0, t = 0, fade = 0, confetti = [];
  const held = {}, pressed = {};
  let lastDir = null, lastUi = { joystick: false, confirm: false };
  const snow = Array.from({ length: 70 }, () => ({ x: rnd(0, MAX_W), y: rnd(0, H), v: rnd(.25, .8), p: rnd(0, 6) }));

  const mkEnt = (f, tx, ty, spd = 2) => ({ f, tx, ty, spd, x: tx * T, y: ty * T, dir: "down", moving: false, prog: 0, step: 0, home: [tx, ty], wait: 0, ai: rnd(30, 120) });
  const occupied = (x, y) => (player && player.tx === x && player.ty === y) || ents.some(e => e.tx === x && e.ty === y);

  function startGame(i) {
    me = FRIENDS[i]; menu = null; dlg = null; cut = null;
    const d = bfs(14, 18);
    const cells = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (d[y][x] >= 0) cells.push({ x, y, d: d[y][x] });
    // Santa se esconde lejos del inicio y junto a algo reconocible, para poder dar pistas reales
    const spots = (minD, minHints) => cells.filter(c => c.d >= minD && landmarksNear(c.x, c.y, 4).length >= minHints);
    const far = [spots(18, 2), spots(10, 2), spots(10, 1), cells.filter(c => c.d >= 10)].find(l => l.length);
    const sc = pick(far);
    santaDist = bfs(sc.x, sc.y); santaHints = landmarksNear(sc.x, sc.y, 4);
    player = mkEnt(me, 14, 18, 1); player.dir = "up";
    santaEnt = mkEnt(SANTA, sc.x, sc.y); santaEnt.santa = true;
    ents = [santaEnt];
    VILLAGERS.forEach(f => {
      const c = pick(cells.filter(c => c.d >= 4 && c.d <= 26 && !occupied(c.x, c.y)));
      ents.push(mkEnt(f, c.x, c.y));
    });
    for (let k = 0; k < 4; k++) {
      const c = pick(cells.filter(c => c.d >= 4 && c.d <= 26 && !occupied(c.x, c.y)));
      const r = mkEnt(REINDEER, c.x, c.y, 1); r.ai = rnd(30, 150); ents.push(r);
    }
    mode = "world"; fade = 1;
    say([
      `Se acerca la Navidad, y Santa Claus ya no quiere trabajar. Dice que este año se siente en la papa, así que te toca a ti, ${me.name}, dar el regalo.`,
      "Pero... Santa te va a decir a quién. Búscalo en el pueblo, ¡está escondido!",
      "Los vecinos del pueblo te darán pistas: habla con ellos para saber si estás frío, tibio o caliente.",
      touch ? "Muévete con el joystick y toca a los vecinos, a Santa y a los renos para hablar con ellos."
        : "Muévete con las FLECHAS y habla con ENTER o Z frente a ellos.",
    ]);
  }

  /* ---------- diálogo ---------- */
  function say(msgs, cb, opt = {}) {
    const pages = [];
    [].concat(msgs).forEach(m => { const ls = wrap(m, Math.floor((W - 28) / 8)); for (let i = 0; i < ls.length; i += 2) pages.push(ls.slice(i, i + 2)); });
    dlg = { pages, i: 0, n: 0, cb, keep: !!opt.keep, locked: false };
  }
  function finishDlg() {
    const cb = dlg.cb;
    if (dlg.keep) dlg.locked = true; else dlg = null;
    if (cb) cb();
  }
  // mensajes de los renos: en bolsa mezclada, para que varíen y no se repitan seguidos
  let deerBag = [], lastDeer;
  function nextDeerMessage() {
    if (!deerBag.length) {
      deerBag = DEER_MESSAGES.map(m => [Math.random(), m]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      if (deerBag.length > 1 && deerBag[deerBag.length - 1] === lastDeer) deerBag.unshift(deerBag.pop());
    }
    return (lastDeer = deerBag.pop());
  }
  function talkFriend(e) {
    e.dir = OPP[player.dir];
    if (e.f.deer) { say(nextDeerMessage()); return; }
    // temperatura según qué tan lejos (caminando) está el jugador de Santa
    const d = santaDist[player.ty][player.tx];
    const temp = d <= 5 ? pick(["¡Estás caliente!", "¡Estás ardiendo!"])
      : d <= 8 ? pick(["Estás tibio...", "Estás tibio, ¡sigue así!"])
      : pick(["Estás frío...", "Brrr, estás frío..."]);
    // cualquiera de los objetos a 4 casillas o menos de Santa
    const where = santaHints.length ? ` ${pick([o => `Me dijeron que lo vieron cerca de ${o}.`, o => `Dicen que anda cerca de ${o}.`, o => `Creo que lo vi cerca de ${o}.`])(pick(santaHints))}` : "";
    say(`${temp}${where}`);
  }
  function talkSanta() {
    santaEnt.dir = OPP[player.dir]; beep(880, .12); setTimeout(() => beep(1175, .15), 120);
    const { amigo, apodo } = sorteoPara(me);
    say([`¡Jo, jo, jo! ¡Me encontraste, ${me.name}!`, `Le tienes que dar el regalo a una ${apodo}.`], () => friendArrives(amigo, apodo));
  }
  /* a quien te tocó sale de la casa más cercana y camina hasta quedar junto al jugador */
  function friendArrives(f, apodo) {
    const [dx, dy] = DOORS.reduce((b, c) => dist(c) < dist(b) ? c : b);
    function dist([x, y]) { return Math.abs(x - player.tx) + Math.abs(y - player.ty); }
    const sy = dy + 1, d = bfs(dx, sy);
    const goal = Object.values(DIRS).map(([ox, oy]) => [player.tx + ox, player.ty + oy])
      .filter(([x, y]) => !solidAt(x, y) && d[y][x] >= 0).reduce((b, c) => d[c[1]][c[0]] < d[b[1]][b[0]] ? c : b);
    const path = ["down"];
    for (let [x, y] = goal; d[y][x] > 0;) {
      const [k, nx, ny] = Object.entries(DIRS).map(([k, [ox, oy]]) => [k, x + ox, y + oy]).find(([, nx, ny]) => d[ny]?.[nx] === d[y][x] - 1);
      path.splice(1, 0, OPP[k]); x = nx; y = ny;
    }
    ents = [];   // el pueblo desaparece para dejar libre el camino
    const e = mkEnt(f, dx, dy, 1); ents.push(e);
    beep(440, .08); setTimeout(() => beep(330, .1), 90);
    cut = { e, f, apodo, path, wait: 50 };
  }
  function updateCut() {
    const { e, f, apodo, path } = cut;
    if (e.moving) return;
    if (path.length) { if (tryMove(e, path[0])) path.shift(); return; }
    for (const k in DIRS) if (e.tx + DIRS[k][0] === player.tx && e.ty + DIRS[k][1] === player.ty) { e.dir = k; player.dir = OPP[k]; }
    if (--cut.wait > 0) return;
    cut = null; endGame(f, apodo);
  }
  function endGame(f, apodo) {
    target = f; targetNick = apodo; mode = "end"; dlg = null;
    confetti = Array.from({ length: 90 }, () => ({ x: rnd(0, W), y: rnd(-H, 0), vy: rnd(.4, 1.2), vx: rnd(-.3, .3), c: pick(["#ff4d4d", "#ffd54a", "#3bff7a", "#4aa8ff", "#fff", "#ff7ad9"]) }));
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => beep(n, .15), i * 120));
  }

  /* ---------- entradas (teclado + D-pad táctil) ---------- */
  const press = d => { held[d] = true; lastDir = d; if (d === "up") pressed.up = true; if (d === "down") pressed.down = true; };
  const release = d => { held[d] = false; };
  const action = () => { pressed.a = true; };
  let stick = null;
  const move = d => {   // joystick
    for (const k of ["up", "down", "left", "right"]) held[k] = k === d;
    if (d) lastDir = d;
    if (d !== stick) { if (d === "up") pressed.up = true; if (d === "down") pressed.down = true; }   // en menús: un paso por empujón
    stick = d;
  };
  const toGame = (clientX, clientY) => {
    const r = cv.getBoundingClientRect(), k = Math.min(r.width / W, r.height / H);
    return [(clientX - r.left - (r.width - W * k) / 2) / k, (clientY - r.top - (r.height - H * k) / 2) / k];
  };
  /* toque en pantalla: empezar, elegir, pasar mensajes o tocar a un personaje para hablarle */
  function tap(clientX, clientY) {
    const [gx, gy] = toGame(clientX, clientY);
    if (mode === "title" || mode === "end") { pressed.a = true; return; }
    if (mode === "select") {
      const hit = menu?.rects?.find(r => gx - OX() >= r.x && gx - OX() <= r.x + r.w && gy >= r.y && gy <= r.y + r.h);
      if (hit) { menu.cur = hit.i; beep(600, .03); }
      return;
    }
    if (mode !== "world" || cut) return;
    if (dlg) { pressed.a = true; return; }
    let best = null, bd = 1e9;
    for (const e of ents) {
      const sx = e.x - camX + 8, sy = e.y - camY - 2;   // centro de la casilla y base del sprite
      if (gx < sx - 14 || gx > sx + 14 || gy < sy - 12 || gy > sy + 20) continue;
      const d = Math.abs(gx - sx) + Math.abs(gy - (sy + 8));
      if (d < bd) { bd = d; best = e; }
    }
    if (best) talkTarget = best;
  }
  const keyDir = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  const onKeyDown = e => {
    const k = e.key.toLowerCase();
    if (keyDir[k]) { press(keyDir[k]); e.preventDefault(); }
    else if (["z", "enter", " "].includes(k)) { if (!e.repeat) action(); e.preventDefault(); }
  };
  const onKeyUp = e => { const d = keyDir[e.key.toLowerCase()]; if (d) release(d); };
  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", onKeyUp);
  const heldDir = () => (lastDir && held[lastDir]) ? lastDir : ["up", "down", "left", "right"].find(d => held[d]) || null;

  /* ---------- lógica ---------- */
  function tryMove(e, dir) {
    e.dir = dir;
    const nx = e.tx + DIRS[dir][0], ny = e.ty + DIRS[dir][1];
    if (solidAt(nx, ny) || occupied(nx, ny)) return false;
    e.tx = nx; e.ty = ny; e.moving = true; e.prog = 0;
    return true;
  }
  function stepEnt(e) {
    if (!e.moving) return;
    e.x += DIRS[e.dir][0] * e.spd; e.y += DIRS[e.dir][1] * e.spd; e.prog += e.spd;
    if (e.prog >= T) { e.moving = false; e.prog = 0; e.x = e.tx * T; e.y = e.ty * T; e.step++; }
  }
  function openSelect() {
    menu = { title: "¿QUIÉN ERES?", items: FRIENDS.map(f => f.name), cur: 0, top: 0, x: 112, y: 8, onSelect: i => startGame(i) };
  }
  function updateDlg() {
    if (dlg.locked) return;
    const total = dlg.pages[dlg.i].join("").length;
    if (dlg.n < total) {
      const before = Math.floor(dlg.n);
      dlg.n = pressed.a ? total : dlg.n + .6;
      if (Math.floor(dlg.n) !== before && Math.floor(dlg.n) % 2 === 0) beep(520, .02, .02);
    } else if (pressed.a) {
      beep(700, .04);
      if (dlg.i < dlg.pages.length - 1) { dlg.i++; dlg.n = 0; } else finishDlg();
    }
  }
  function updateMenu() {
    if (!menu) return;
    const n = menu.items.length;
    if (pressed.up) { menu.cur = (menu.cur + n - 1) % n; beep(600, .03); }
    if (pressed.down) { menu.cur = (menu.cur + 1) % n; beep(600, .03); }
    if (pressed.a) { beep(880, .08); const m = menu; m.onSelect(m.cur); }
  }
  function update() {
    t++;
    snow.forEach(s => { s.y += s.v; s.x += Math.sin((t + s.p * 40) / 40) * .25; if (s.y > H) { s.y = -2; s.x = rnd(0, W); } });
    if (fade > 0) fade = Math.max(0, fade - .03);
    if (mode === "title") { if (pressed.a) { beep(784); mode = "select"; openSelect(); } }
    else if (mode === "select") updateMenu();
    else if (mode === "end") {
      confetti.forEach(c => { c.y += c.vy; c.x += c.vx + Math.sin((t + c.x) / 15) * .2; if (c.y > H) { c.y = -3; c.x = rnd(0, W); } });
      if (pressed.a) { beep(784); mode = "title"; }
    } else if (mode === "world") {
      ents.forEach(stepEnt); stepEnt(player);
      if (menu) updateMenu();
      else if (dlg) updateDlg();
      else if (cut) updateCut();
      else {
        if (!player.moving) {
          if (talkTarget) {
            const e = talkTarget, dx = e.tx - player.tx, dy = e.ty - player.ty;
            talkTarget = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1 && (dx || dy)) {   // junto a ti: se voltea hacia él y le habla
              player.dir = Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
              beep(660, .06); if (e === santaEnt) talkSanta(); else talkFriend(e);
              pressed.a = false;
            } else beep(260, .05);   // muy lejos: acércate
          }
          const d = heldDir();
          if (d) {
            if (player.dir !== d) { player.dir = d; player.wait = 5; }
            else if (player.wait > 0) player.wait--;
            else tryMove(player, d);
          } else player.wait = 0;
          if (pressed.a && !player.moving && !dlg) {
            const nx = player.tx + DIRS[player.dir][0], ny = player.ty + DIRS[player.dir][1];
            const e = ents.find(e => e.tx === nx && e.ty === ny);
            if (e) { beep(660, .06); if (e === santaEnt) talkSanta(); else talkFriend(e); }
          }
        }
        ents.forEach(e => {
          if (e === santaEnt || e.moving) return;
          if (--e.ai <= 0) {
            e.ai = rnd(60, 200);
            const d = pick(Object.keys(DIRS)), nx = e.tx + DIRS[d][0], ny = e.ty + DIRS[d][1];
            if (Math.abs(nx - e.home[0]) + Math.abs(ny - e.home[1]) <= 6) tryMove(e, d);
          }
        });
      }
    }
    pressed.a = pressed.up = pressed.down = false;
    // qué controles táctiles se ven: joystick al elegir y al caminar (no mientras hay mensajes), "confirmar" solo al elegir
    const ui = { joystick: mode === "select" || (mode === "world" && !dlg && !cut), confirm: mode === "select" };
    if (ui.joystick !== lastUi.joystick || ui.confirm !== lastUi.confirm) {
      if (!ui.joystick) move(null);
      lastUi = ui; onUi(ui);
    }
  }

  /* ---------- dibujo ---------- */
  const ready = i => i && i.complete && i.naturalWidth;
  function drawPerson(p, x, y, dir = "down", frame = 0, scale = 1, bob = 0) {
    if (p.deer) {
      if (!ready(p.sheetImg)) return;
      ctx.drawImage(p.sheetImg, frame * 40,   // 0 quieto, 1 paso, 2 salto
         DEER_ROW[dir] * 36, 40, 36, x - 2, y + 16 - 18 - bob, 20, 18);
    } else if (p.sheet) {
      if (!ready(p.sheetImg)) return;
      // sprite de 16x22 con los pies sobre la base de la casilla de 16x16
      const w = 16 * scale, h = 22 * scale;
      ctx.drawImage(p.sheetImg, frame * SPR_W, DIR_ROW[dir] * SPR_H, SPR_W, SPR_H, x, y + 16 * scale - h - bob, w, h);
    } else ctx.drawImage(p.spr[dir][frame], x, y, 16 * scale, 16 * scale);
  }
  function drawPortrait(p, cx, y, h) {
    if (!p.sheet) return drawPerson(p, cx - 32, y, "down", 0, 4);
    if (ready(p.portraitImg)) ctx.drawImage(p.portraitImg, cx - h * PORTRAIT_W / PORTRAIT_H / 2, y, h * PORTRAIT_W / PORTRAIT_H, h);
  }
  function box(x, y, w, h) {
    R("#283048", x + 1, y, w - 2, h); R("#283048", x, y + 1, w, h - 2);
    R("#c0392b", x + 2, y + 2, w - 4, h - 4); R("#fffdf4", x + 3, y + 3, w - 6, h - 6);
  }
  function txt(s, x, y, col = "#303040") { ctx.fillStyle = "#c4c4d0"; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y); }
  function cursor(x, y) { R("#303040", x, y, 1, 8); R("#303040", x + 1, y + 1, 1, 6); R("#303040", x + 2, y + 2, 1, 4); R("#303040", x + 3, y + 3, 1, 2); }
  function drawMenu(m) {
    const vis = Math.min(m.items.length, 6), rh = 14, hh = m.title ? 14 : 0;
    const mw = Math.max(...m.items.map(s => s.length), m.title ? m.title.length : 0) * 8 + 28, mh = vis * rh + 12 + hh;
    const x = m.right ? W - 4 - mw : m.x, y = m.bottom ? 108 - mh : m.y;
    box(x, y, mw, mh);
    if (m.title) txt(m.title, x + 10, y + 8, "#c0392b");
    if (m.cur < m.top) m.top = m.cur;
    if (m.cur >= m.top + vis) m.top = m.cur - vis + 1;
    m.rects = [];
    for (let k = 0; k < vis; k++) {
      const i = m.top + k, yy = y + 8 + hh + k * rh;
      m.rects.push({ i, x, y: yy - 3, w: mw, h: rh });
      txt(m.items[i], x + 20, yy);
      if (i === m.cur) cursor(x + 9, yy);
    }
  }
  function drawDlg() {
    if (!dlg) return;
    box(4, 112, W - 8, 44);
    let left = Math.floor(dlg.n);
    if (dlg.locked) left = 999;
    dlg.pages[dlg.i].forEach((ln, k) => { txt(ln.slice(0, left), 14, 122 + k * 14); left = Math.max(0, left - ln.length); });
    if (!dlg.locked && dlg.n >= dlg.pages[dlg.i].join("").length && Math.floor(t / 20) % 2) {
      const ax = W - 18; R("#c0392b", ax, 146, 7, 1); R("#c0392b", ax + 1, 147, 5, 1); R("#c0392b", ax + 2, 148, 3, 1); R("#c0392b", ax + 3, 149, 1, 1);
    }
  }
  function drawSnow() { ctx.fillStyle = "#fff"; snow.forEach(s => ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)); }
  function pine(x, y) {
    R("#6b4423", x - 1, y - 2, 2, 3);
    R("#1c6b3a", x - 4, y - 5, 9, 3); R("#1c6b3a", x - 3, y - 8, 7, 3); R("#1c6b3a", x - 2, y - 11, 5, 3); R("#1c6b3a", x - 1, y - 13, 3, 2);
    R("#fff", x - 4, y - 5, 3, 1); R("#fff", x - 3, y - 8, 2, 1); R("#fff", x - 1, y - 13, 2, 1);
    R((Math.floor(t / 15) + x) % 2 ? "#ffd54a" : "#ff4d4d", x + 1, y - 7, 1, 1); R("#4aa8ff", x - 2, y - 4, 1, 1);
  }
  function drawSky(bands, bandH, starRate) {
    bands.forEach((c, i) => R(c, 0, i * bandH, W, bandH));
    if (bands.length * bandH < H) R(bands.at(-1), 0, bands.length * bandH, W, H - bands.length * bandH);   // sin hueco negro tras las colinas
    STARS.forEach(([x, y, i]) => { if ((Math.floor(t / starRate) + i) % 6) R("#fff", x, y, 1, 1); });
  }
  function drawTitle(selecting) {
    drawSky(["#0a0f2e", "#101a4a", "#182a66", "#24408a"], 30, 25);
    const mx = W - 40; R("#fff3c4", mx, 16, 14, 14); R("#fff3c4", mx - 1, 18, 16, 10); R("#e0d49a", mx + 4, 20, 3, 3); R("#e0d49a", mx + 9, 25, 2, 2);
    for (let x = 0; x < W; x++) {
      const h = Math.round(122 + 4 * Math.sin(x / 22) + 3 * Math.sin(x / 9));
      R("#f4f8ff", x, h, 1, H - h); R("#dfe8f5", x, h + 14 + Math.round(2 * Math.sin(x / 15)), 1, H);
    }
    R("#2f3040", 0, 3, W, 1);
    for (let x = 6; x < W; x += 12) { R(["#ff4d4d", "#ffd54a", "#3bff7a", "#4aa8ff"][(x / 12 + Math.floor(t / 20)) % 4], x, 4, 3, 3); }
    [8, 40].forEach((x, i) => pine(x, 128 + (i % 2) * 3));
    [W - 35, W - 10].forEach((x, i) => pine(x, 128 + (i % 2) * 3));
    ctx.save(); ctx.translate(OX(), 0);
    if (selecting) {
      const f = FRIENDS[menu ? menu.cur : 0];
      box(8, 14, 96, 100);
      drawPortrait(f, 56, 20, 72);
      ctx.textAlign = "center"; txt(f.name, 56, 98, "#c0392b"); ctx.textAlign = "left";
      if (menu) drawMenu(menu);
      ctx.restore();
      return;
    }
    const line = [SANTA, ...VILLAGERS], sp = Math.min(32, 224 / line.length), x0 = (BASE_W - sp * line.length) / 2;
    line.forEach((p, i) => drawPerson(p, Math.round(x0 + i * sp), 118 + (i % 2) * 6, "down", Math.floor(t / 20 + i) % 3 === 0 ? 1 : 0, 2));
    ctx.textAlign = "center";
    ctx.font = BIG;
    ctx.fillStyle = "#7a1010"; ctx.fillText("SECRET", 122, 24); ctx.fillText("SANTA", 122, 44);
    ctx.fillStyle = "#ffd54a"; ctx.fillText("SECRET", 120, 22);
    ctx.fillStyle = "#fff"; ctx.fillText("SANTA", 120, 42);
    ctx.font = FONT;
    txt("~ Fiesta de Amigo Secreto ~", 120, 66, "#bfe6ff");
    if (Math.floor(t / 30) % 2) txt(touch ? "TOCA LA PANTALLA" : "PULSA ENTER", 120, 88, "#ffd54a");
    ctx.textAlign = "left";
    ctx.restore();
    drawSnow();
  }
  function drawWorld() {
    const cx = clamp(Math.round(player.x) + 8 - W / 2, 0, MW * T - W), cy = clamp(Math.round(player.y) + 8 - H / 2, 0, MH * T - H);
    camX = cx; camY = cy;
    for (let y = Math.floor(cy / T); y <= Math.floor((cy + H - 1) / T); y++)
      for (let x = Math.floor(cx / T); x <= Math.floor((cx + W - 1) / T); x++) {
        const ch = map[y][x], tile = ch === "." ? TILES.snow[(x * 7 + y * 13) % 3] : ch === "X" ? TILES.snow[0] : TILES[ch];
        ctx.drawImage(tile, x * T - cx, y * T - cy);
      }
    const bx = TREE_X * T - cx, by = TREE_Y * T - cy;
    ctx.drawImage(BIGTREE, bx, by);
    TREE_LIGHTS.forEach(([lx, ly], i) => {
      const on = (Math.floor(t / 18) + i) % 3;
      R(["#ff4d4d", "#ffd54a", "#4aa8ff", "#3bff7a"][(i + Math.floor(t / 54)) % 4], bx + lx, by + ly, 2, 2);
      if (!on) R("#fff", bx + lx, by + ly, 1, 1);
    });
    const items = [
      ...DECOR.map(d => ({ y: d.ty * T, draw: () => {
        const { img, w, h } = DECOR_IMGS[d.kind];
        if (ready(img)) ctx.drawImage(img, d.tx * T + 8 - w / 2 - cx, d.ty * T + T - h - cy, w, h);
      } })),
      ...[...ents, player].map(e => ({ y: e.y, draw: () => {
        const frame = e.moving ? 1 + (e.step % 2) : 0;
        drawPerson(e.f, Math.round(e.x - cx), Math.round(e.y - cy) - 2, e.dir, frame, 1, e.moving && (e.prog >> 2) % 2 ? 1 : 0);
      } })),
    ].sort((a, b) => a.y - b.y);
    items.forEach(i => i.draw());
    drawSnow();
  }
  function drawEnd() {
    drawSky(["#0a0f2e", "#101a4a", "#182a66", "#24408a", "#2d4f9c"], 32, 15);
    ctx.save(); ctx.translate(OX(), 0);
    box(12, 8, 216, 144);
    ctx.textAlign = "center";
    txt("¡TU AMIGO SECRETO ES!", 120, 18, "#c0392b");
    drawPortrait(target, 120, 28, 56);
    wrap(`Le tienes que dar el regalo a la ${targetNick} de ${target.name}`).forEach((ln, k) => txt(ln, 120, 88 + k * 12, "#1c6b3a"));
    txt("¡Shhh! ¡Es un secreto!", 120, 126, "#303040");
    if (Math.floor(t / 30) % 2) txt(touch ? "TOCA PARA VOLVER" : "ENTER para volver", 120, 138, "#c0392b");
    ctx.textAlign = "left";
    ctx.restore();
    confetti.forEach(c => R(c.c, Math.round(c.x), Math.round(c.y), 2, 2));
  }
  function draw() {
    ctx.textBaseline = "top"; ctx.textAlign = "left"; ctx.font = FONT;
    if (mode === "title") drawTitle(false);
    else if (mode === "select") drawTitle(true);
    else if (mode === "world") { drawWorld(); drawDlg(); }
    else drawEnd();
    if (fade > 0) { ctx.globalAlpha = fade; R("#000", 0, 0, W, H); ctx.globalAlpha = 1; }
  }

  /* ---------- loop ---------- */
  document.fonts?.load(FONT).catch(() => {});
  let raf, last = performance.now(), acc = 0;
  const frame = now => {
    acc += Math.min(now - last, 100); last = now;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
    draw(); raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    input: { press, release, action, move, tap },
    /** Ajusta el ancho del juego a la proporción de la pantalla (el alto siempre es H). */
    resize(aspect) {
      const w = clamp(Math.round(H * aspect), BASE_W, MAX_W);
      if (w === W) return;
      W = w; cv.width = W; ctx.imageSmoothingEnabled = false;
    },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
    },
  };
}
