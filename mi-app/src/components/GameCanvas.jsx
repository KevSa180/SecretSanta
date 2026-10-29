import { useEffect, useRef } from "react";
import { createGame, BASE_W, H } from "../game/engine.js";
import { startMusic } from "../game/music.js";

export default function GameCanvas({ inputRef, onUi }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const game = createGame(canvas, onUi);
    inputRef.current = game.input;
    // el juego se ensancha para llenar la pantalla (el alto siempre es el mismo)
    const fit = () => game.resize(canvas.clientWidth / canvas.clientHeight);
    const ro = new ResizeObserver(fit);
    ro.observe(canvas); fit();
    const stopMusic = startMusic();
    return () => { ro.disconnect(); game.destroy(); stopMusic(); inputRef.current = null; };
  }, [inputRef, onUi]);

  return (
    <canvas
      ref={canvasRef}
      width={BASE_W}
      height={H}
      onPointerDown={e => inputRef.current?.tap(e.clientX, e.clientY)}
    />
  );
}
