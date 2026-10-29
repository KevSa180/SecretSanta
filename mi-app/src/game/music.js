/* Música de fondo: suena desde 1:46 hasta el final y vuelve a 1:46 en bucle.
   Usa un <audio> normal (no Web Audio): en iPhone suena aunque el interruptor
   de silencio esté puesto, y en Android/iOS se desbloquea con el primer toque. */
const SRC = "/musica.mp3";
const LOOP_FROM = 107;   // segundos (1:46)
const VOLUME = 0.35;
const EVENTS = ["pointerdown", "pointerup", "touchend", "click", "keydown"];

let audio;
function getAudio() {
  if (audio) return audio;
  audio = new Audio(SRC);
  audio.preload = "auto";
  audio.volume = VOLUME;
  audio.playsInline = true;
  const seekToLoop = () => { if (audio.currentTime < LOOP_FROM) audio.currentTime = LOOP_FROM; };
  audio.addEventListener("loadedmetadata", seekToLoop);
  audio.addEventListener("timeupdate", () => { if (audio.duration && audio.currentTime >= audio.duration - 0.25) audio.currentTime = LOOP_FROM; });
  audio.addEventListener("ended", () => { audio.currentTime = LOOP_FROM; audio.play().catch(() => {}); });
  audio.load();
  return audio;
}

/** Empieza al abrir la app. Si el navegador bloquea el autoplay, arranca con el primer toque o tecla (y se reintenta si se vuelve a pausar). */
export function startMusic() {
  const a = getAudio();
  const tryPlay = () => { if (a.paused && !document.hidden) a.play().catch(() => {}); };
  const onVisibility = () => { if (document.hidden) a.pause(); else tryPlay(); };
  tryPlay();
  EVENTS.forEach(e => addEventListener(e, tryPlay));
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    EVENTS.forEach(e => removeEventListener(e, tryPlay));
    document.removeEventListener("visibilitychange", onVisibility);
    a.pause();
  };
}
