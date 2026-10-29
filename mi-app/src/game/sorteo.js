import { FRIENDS } from "./data.js";

/* Sorteo del amigo secreto. Se calcula siempre igual a partir de SEMILLA, así
   todos los teléfonos/compus coinciden sin servidor. El resultado nunca se
   escribe ni se imprime en ningún lado: cada quien solo lo ve al jugar.
   Para volver a sortear (sin ver el resultado), cambia el número. */
const SEMILLA = 1248;

export const APODOS = ["Zorra", "Puta", "Perra", "Prostituta"];

const mulberry32 = a => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffled = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const rand = mulberry32(SEMILLA);
// cada amigo recibe un apodo distinto
const apodoDe = new Map(shuffled(APODOS, rand).map((a, i) => [FRIENDS[i].name, a]));
// un solo círculo: cada quien le da al siguiente y el último al primero,
// así nadie le da a quien le da a él (no hay parejas cruzadas)
const circulo = shuffled(FRIENDS, rand);
const daA = new Map(circulo.map((f, i) => [f.name, circulo[(i + 1) % circulo.length]]));

/** A quién le da el regalo `me`, y con qué apodo lo presenta Santa. */
export const sorteoPara = me => {
  const amigo = daA.get(me.name);
  return { amigo, apodo: apodoDe.get(amigo.name) };
};
