"use client";

/**
 * 春日花瓣飘落（随季节显示）
 */
const PETALS = [
  { left: 5, delay: 0, duration: 20, size: 10, drift: 12 },
  { left: 25, delay: 3, duration: 22, size: 8, drift: -15 },
  { left: 45, delay: 1, duration: 18, size: 12, drift: 10 },
  { left: 65, delay: 4, duration: 24, size: 9, drift: -12 },
  { left: 85, delay: 2, duration: 19, size: 11, drift: 8 },
  { left: 15, delay: 5, duration: 21, size: 8, drift: -10 },
  { left: 55, delay: 0.5, duration: 23, size: 10, drift: 14 },
  { left: 75, delay: 2.5, duration: 17, size: 9, drift: -8 },
  { left: 35, delay: 1.5, duration: 20, size: 11, drift: 11 },
  { left: 95, delay: 3.5, duration: 19, size: 8, drift: -14 },
];

export function FallingPetals() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden
    >
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="absolute petal-fall"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--petal-drift": `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
