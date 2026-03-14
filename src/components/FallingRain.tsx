"use client";

/**
 * 夏天下雨效果：雨丝下落
 */
const DROPS = Array.from({ length: 50 }, (_, i) => ({
  left: (i * 7 + (i % 5) * 11) % 100,
  delay: (i * 0.15 + (i % 3) * 0.4) % 2.5,
  duration: 0.8 + (i % 7) * 0.2,
  length: 12 + (i % 5) * 4,
  opacity: 0.25 + (i % 4) * 0.15,
}));

export function FallingRain() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden
    >
      {DROPS.map((d, i) => (
        <div
          key={i}
          className="absolute rain-drop"
          style={{
            left: `${d.left}%`,
            top: "-5%",
            width: "2px",
            height: `${d.length}px`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
