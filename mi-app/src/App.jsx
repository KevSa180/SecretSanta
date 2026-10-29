import { useEffect, useRef, useState } from "react";
import GameCanvas from "./components/GameCanvas.jsx";
import Joystick from "./components/Joystick.jsx";
import "./App.css";

export default function App() {
  const inputRef = useRef(null);
  const [ui, setUi] = useState({ joystick: false, confirm: false });

  // en Android: al primer toque pasa a pantalla completa y bloquea horizontal (iPhone no lo permite; ahí se usa "Añadir a pantalla de inicio")
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) return;
    const go = async () => {
      removeEventListener("pointerup", go);
      try {
        await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
        await screen.orientation?.lock?.("landscape");
      } catch { /* no soportado */ }
    };
    addEventListener("pointerup", go);
    return () => removeEventListener("pointerup", go);
  }, []);

  return (
    <div className="app">
      <GameCanvas inputRef={inputRef} onUi={setUi} />
      <Joystick inputRef={inputRef} visible={ui.joystick} />
      <button
        className={`confirm${ui.confirm ? " show" : ""}`}
        onPointerDown={e => { e.preventDefault(); inputRef.current?.action(); }}
        onContextMenu={e => e.preventDefault()}
      >
        CONFIRMAR
      </button>
      <div className="rotate" role="alert">
        <div className="rotate-phone" aria-hidden="true">📱</div>
        <p>Gira tu teléfono</p>
        <small>Este juego se juega en horizontal</small>
      </div>
    </div>
  );
}
