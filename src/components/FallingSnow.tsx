"use client";

/**
 * 六角雪花 SVG，中心 (12,12)，半径约 10
 */
function SnowflakeSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="snowflake-svg"
      aria-hidden
    >
      {/* 6 条主枝 */}
      <line x1="12" y1="12" x2="12" y2="2" />
      <line x1="12" y1="12" x2="17" y2="5" />
      <line x1="12" y1="12" x2="17" y2="19" />
      <line x1="12" y1="12" x2="12" y2="22" />
      <line x1="12" y1="12" x2="7" y2="19" />
      <line x1="12" y1="12" x2="7" y2="5" />
      {/* 小分叉，更像雪花 */}
      <line x1="12" y1="5" x2="14" y2="7" />
      <line x1="12" y1="5" x2="10" y2="7" />
      <line x1="17" y1="8" x2="19" y2="10" />
      <line x1="17" y1="8" x2="15" y2="10" />
      <line x1="17" y1="16" x2="19" y2="14" />
      <line x1="17" y1="16" x2="15" y2="14" />
      <line x1="12" y1="19" x2="14" y2="17" />
      <line x1="12" y1="19" x2="10" y2="17" />
      <line x1="7" y1="16" x2="5" y2="14" />
      <line x1="7" y1="16" x2="9" y2="14" />
      <line x1="7" y1="8" x2="5" y2="10" />
      <line x1="7" y1="8" x2="9" y2="10" />
    </svg>
  );
}

/**
 * 下雪效果：六角雪花，尺寸更大，与背景区分明显
 */
const SNOWFLAKES = [
  { left: 3, delay: 0, duration: 16, size: 20, drift: 15 },
  { left: 18, delay: 2, duration: 20, size: 16, drift: -18 },
  { left: 32, delay: 0.5, duration: 18, size: 24, drift: 12 },
  { left: 48, delay: 3.5, duration: 22, size: 14, drift: -14 },
  { left: 58, delay: 1, duration: 17, size: 20, drift: 10 },
  { left: 72, delay: 2.5, duration: 19, size: 18, drift: -16 },
  { left: 88, delay: 0.8, duration: 21, size: 16, drift: 14 },
  { left: 10, delay: 4, duration: 18, size: 22, drift: -12 },
  { left: 42, delay: 1.5, duration: 20, size: 14, drift: 11 },
  { left: 65, delay: 3, duration: 16, size: 20, drift: -15 },
  { left: 82, delay: 0.3, duration: 19, size: 18, drift: 13 },
  { left: 25, delay: 2.2, duration: 21, size: 16, drift: -10 },
  { left: 55, delay: 1.2, duration: 17, size: 24, drift: 9 },
  { left: 78, delay: 3.8, duration: 20, size: 14, drift: -17 },
  { left: 92, delay: 0.6, duration: 18, size: 20, drift: 12 },
  { left: 15, delay: 2.8, duration: 22, size: 16, drift: -11 },
  { left: 38, delay: 1.8, duration: 16, size: 22, drift: 15 },
  { left: 68, delay: 0.4, duration: 19, size: 18, drift: -13 },
  { left: 85, delay: 3.2, duration: 21, size: 14, drift: 10 },
];

export function FallingSnow() {
  return (
    <div
      className="falling-snow"
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {SNOWFLAKES.map((s, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            "--snow-left": `${s.left}%`,
            "--snow-delay": `${s.delay}s`,
            "--snow-duration": `${s.duration}s`,
            "--snow-size": `${s.size}px`,
            "--snow-drift": `${s.drift}px`,
          } as React.CSSProperties}
        >
          <SnowflakeSvg size={s.size} />
        </div>
      ))}
    </div>
  );
}
