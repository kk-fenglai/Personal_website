"use client";

/**
 * 右下角雪人装饰 - 更真实的立体感与细节
 */
export function Snowman() {
  return (
    <div
      className="snowman-wrap fixed bottom-6 right-6 z-20 pointer-events-none select-none"
      aria-hidden
      style={{ width: 88, height: 120 }}
    >
      <svg
        viewBox="0 0 88 120"
        fill="none"
        className="w-[88px] h-[120px] drop-shadow-lg"
      >
        <defs>
          {/* 雪球立体渐变：左上方受光 */}
          <radialGradient id="snow-shade" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#f0f4f8" stopOpacity="1" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="1" />
          </radialGradient>
          {/* 帽子渐变 */}
          <linearGradient id="hat-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          {/* 胡萝卜鼻子渐变 */}
          <linearGradient id="carrot" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#f59e42" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          {/* 围巾 */}
          <linearGradient id="scarf" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          </defs>

        {/* 地面阴影 */}
        <ellipse cx="44" cy="116" rx="30" ry="6" fill="rgba(0,0,0,0.1)" />

        {/* 底座大球 - 略扁贴地 */}
        <ellipse cx="44" cy="92" rx="26" ry="24" className="snowman-body" fill="url(#snow-shade)" stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />
        {/* 中间球 */}
        <circle cx="44" cy="56" r="18" className="snowman-body" fill="url(#snow-shade)" stroke="rgba(148,163,184,0.2)" strokeWidth="0.6" />
        {/* 头 */}
        <circle cx="44" cy="28" r="12" className="snowman-body" fill="url(#snow-shade)" stroke="rgba(148,163,184,0.2)" strokeWidth="0.5" />

        {/* 围巾 */}
        <path
          d="M 32 38 Q 44 42 56 38 L 58 42 Q 44 46 30 42 Z"
          fill="url(#scarf)"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.4"
        />
        <path d="M 30 42 L 36 52 L 34 54 L 28 44 Z" fill="url(#scarf)" stroke="rgba(0,0,0,0.12)" strokeWidth="0.3" />
        <path d="M 58 42 L 52 52 L 54 54 L 60 44 Z" fill="url(#scarf)" stroke="rgba(0,0,0,0.12)" strokeWidth="0.3" />

        {/* 树枝手臂 */}
        <path
          d="M 26 54 Q 12 48 8 58 Q 6 62 10 60"
          stroke="#78350f"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 62 54 Q 76 50 80 58 Q 82 62 78 62"
          stroke="#78350f"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 帽子 */}
        <rect x="34" y="2" width="20" height="16" rx="2" fill="url(#hat-grad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        <rect x="30" y="16" width="28" height="5" rx="2" fill="url(#hat-grad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        <rect x="38" y="14" width="12" height="4" fill="#dc2626" stroke="rgba(0,0,0,0.15)" strokeWidth="0.3" />
        <circle cx="44" cy="0" r="5" fill="#fef3c7" stroke="rgba(0,0,0,0.1)" strokeWidth="0.4" />

        {/* 眼睛：煤球感，带高光 */}
        <circle cx="39" cy="26" r="2.2" className="snowman-eye" fill="#1f2937" />
        <circle cx="39.8" cy="25.2" r="0.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="49" cy="26" r="2.2" className="snowman-eye" fill="#1f2937" />
        <circle cx="49.8" cy="25.2" r="0.5" fill="rgba(255,255,255,0.5)" />

        {/* 鼻子（胡萝卜） */}
        <path
          d="M 44 28 L 56 29.5 L 55 31 L 44 29.5 Z"
          fill="url(#carrot)"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.4"
        />

        {/* 纽扣（在中间球上） */}
        <circle cx="44" cy="50" r="2" className="snowman-btn" fill="#1f2937" />
        <circle cx="44" cy="58" r="2" className="snowman-btn" fill="#1f2937" />
        <circle cx="44" cy="66" r="2" className="snowman-btn" fill="#1f2937" />
      </svg>
    </div>
  );
}
