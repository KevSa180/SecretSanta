/* ================= EDITA AQUÍ: amigos y gente del pueblo ================= */
/* Los 4 amigos reales: las hojas de sprites están en public/sprites/
   (<nombre>.png = 3 cuadros x 4 direcciones, <nombre>-portrait.png = retrato). */
export const FRIENDS = [
  { name: "Dani",  sheet: "/sprites/dani.png",  portrait: "/sprites/dani-portrait.png" },
  { name: "Belén", sheet: "/sprites/belen.png", portrait: "/sprites/belen-portrait.png" },
  { name: "Yos",   sheet: "/sprites/yos.png",   portrait: "/sprites/yos-portrait.png" },
  { name: "Said",  sheet: "/sprites/said.png",  portrait: "/sprites/said-portrait.png" },
];

/* Gente del pueblo (relleno que da pistas; se dibuja con colores). */
export const VILLAGERS = [
  { name: "Alex",   shirt: "#3b82f6", hair: "#5a3a1a", skin: "#f2c9a0", pants: "#33406b", hat: "#c0392b" },
  { name: "Jamie",  shirt: "#e67e22", hair: "#1e1e24", skin: "#c68642", pants: "#3a3a4a", hat: "#2e8b57" },
  { name: "Sam",    shirt: "#9b59b6", hair: "#e0b040", skin: "#f7d6b5", pants: "#2c3e50", hat: "#c0392b" },
  { name: "Riley",  shirt: "#16a085", hair: "#8b2d2d", skin: "#e8b88a", pants: "#4a4a5a", hat: "#2e8b57" },
  { name: "Casey",  shirt: "#e84a8a", hair: "#2a1a10", skin: "#8d5524", pants: "#33406b", hat: "#c0392b" },
  { name: "Morgan", shirt: "#f1c40f", hair: "#d8d8e0", skin: "#f2c9a0", pants: "#3a3a4a", hat: "#2e8b57" },
];
export const SANTA = { name: "Santa", santa: true, shirt: "#d63a35", hair: "#fff", skin: "#f2c9a0", pants: "#8e2423", hat: "#d63a35" };
/* ==================================================================== */

/* Lo que dicen los renos (salen al azar, sin repetirse hasta haberlos dicho todos). */
export const DEER_MESSAGES = [
  "Las amo con todo mi ser",
  "Nunca dejes de ser ese brillo que ilumina mi vida",
  "Vea Zorra",
  "Gracias por siempre estar",
  "Una navidad más cerca a que todos lleguemos con novio",
  "Son unas diosas",
  "Las amo",
];
