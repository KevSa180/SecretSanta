import { useEffect, useRef } from "react";

const DEAD_ZONE = 0.28;   // fracción del radio sin movimiento

export default function Joystick({ inputRef, visible }) {
  const base = useRef(null), knob = useRef(null), pointer = useRef(null);

  const update = e => {
    const r = base.current.getBoundingClientRect(), radius = r.width / 2;
    const dx = e.clientX - (r.left + radius), dy = e.clientY - (r.top + radius);
    const len = Math.hypot(dx, dy) || 1, k = Math.min(1, radius * 0.6 / len);
    knob.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    const dir = len < radius * DEAD_ZONE ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    inputRef.current?.move(dir);
  };
  const end = e => {
    if (e.pointerId !== pointer.current) return;
    pointer.current = null;
    knob.current.style.transform = "";
    inputRef.current?.move(null);
  };

  // al ocultarse (mensajes en pantalla) se suelta todo
  useEffect(() => {
    if (visible) return;
    pointer.current = null;
    knob.current.style.transform = "";
    inputRef.current?.move(null);
  }, [visible, inputRef]);

  return (
    <div
      ref={base}
      className={`joystick${visible ? " show" : ""}`}
      onPointerDown={e => { e.preventDefault(); pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
      onPointerMove={e => { if (e.pointerId === pointer.current) update(e); }}
      onPointerUp={end}
      onPointerCancel={end}
      onContextMenu={e => e.preventDefault()}
    >
      <div ref={knob} className="knob" />
    </div>
  );
}
