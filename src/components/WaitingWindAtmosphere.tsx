"use client";

/**
 * 等风来意境：背景水印 + 风痕曲线
 */
export function WaitingWindAtmosphere() {
  return (
    <div
      className="waiting-wind-atmosphere"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* 风痕：几缕轻柔的曲线，缓慢流动 */}
      <svg
        className="absolute inset-0 w-full h-full wind-lines"
        viewBox="0 0 400 300"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          className="wind-line wind-line-1"
          d="M -20 80 Q 80 60 180 90 T 420 70"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="wind-line wind-line-2"
          d="M -10 160 Q 120 140 220 165 T 410 150"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="wind-line wind-line-3"
          d="M -30 220 Q 100 200 250 230 T 430 210"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
