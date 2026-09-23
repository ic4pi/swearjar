import { useEffect, useRef } from "react";

/**
 * Difference-blend dot cursor that trails the pointer and swells over
 * interactive elements. Disabled on touch devices via CSS.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;

    let x = -100, y = -100, tx = -100, ty = -100;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest("a, button, [role='button'], input, select, textarea, label, [data-cursor]");
      dot.classList.toggle("is-active", Boolean(interactive));
    };

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      dot.style.transform = `translate(${x - (dot.classList.contains("is-active") ? 28 : 5)}px, ${y - (dot.classList.contains("is-active") ? 28 : 5)}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={dotRef} className="cursor-dot" aria-hidden />;
}
