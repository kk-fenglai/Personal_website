"use client";

/**
 * 秋日落叶（随季节显示）
 */
const LEAVES = [
  { left: 8, delay: 0, duration: 18, size: 14, drift: 15 },
  { left: 28, delay: 2, duration: 22, size: 12, drift: -18 },
  { left: 48, delay: 1, duration: 20, size: 16, drift: 12 },
  { left: 68, delay: 3.5, duration: 19, size: 11, drift: -14 },
  { left: 88, delay: 0.8, duration: 21, size: 13, drift: 10 },
  { left: 18, delay: 4, duration: 17, size: 15, drift: -12 },
  { left: 58, delay: 1.5, duration: 23, size: 10, drift: 16 },
  { left: 78, delay: 2.5, duration: 18, size: 14, drift: -10 },
  { left: 38, delay: 0.3, duration: 20, size: 12, drift: 11 },
  { left: 98, delay: 3, duration: 19, size: 11, drift: -15 },
];

export function FallingLeaves() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden
    >
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className="absolute leaf-fall"
          style={{
            left: `${l.left}%`,
            top: "-24px",
            width: `${l.size}px`,
            height: `${l.size * 1.3}px`,
            animationDelay: `${l.delay}s`,
            animationDuration: `${l.duration}s`,
            "--leaf-drift": `${l.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
