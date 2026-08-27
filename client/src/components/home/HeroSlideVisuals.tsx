export function GardenVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf6e8" />
          <stop offset="100%" stopColor="#a8d9a1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#garden-sky)" />
      <circle cx="1040" cy="120" r="70" fill="#ffd77a" />
      <ellipse cx="600" cy="560" rx="640" ry="60" fill="#7fc178" opacity="0.55" />
      <g transform="translate(760,300)">
        <path d="M10 90 L280 90 L255 300 L45 300 Z" fill="#c96b3f" />
        <rect x="0" y="60" width="290" height="38" rx="14" fill="#a8552f" />
        <path d="M90 60 C90 -60 210 -60 210 60" fill="none" stroke="#2c722a" strokeWidth="20" strokeLinecap="round" />
        <path d="M150 60 C135 -90 90 -105 60 -75" fill="none" stroke="#3d8f39" strokeWidth="16" strokeLinecap="round" />
        <path d="M150 60 C165 -105 225 -120 250 -82" fill="none" stroke="#5eae59" strokeWidth="16" strokeLinecap="round" />
      </g>
      <g transform="translate(120,360)">
        <path d="M8 40 L192 40 L172 190 L28 190 Z" fill="#e08a52" />
        <rect x="0" y="18" width="200" height="30" rx="12" fill="#c96b3f" />
        <circle cx="100" cy="-16" r="66" fill="#5eae59" />
        <circle cx="55" cy="16" r="42" fill="#3d8f39" />
        <circle cx="145" cy="16" r="42" fill="#3d8f39" />
      </g>
    </svg>
  );
}

export function PlantersVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="planters-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2e9dd" />
          <stop offset="100%" stopColor="#e0b98a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#planters-bg)" />
      <ellipse cx="600" cy="560" rx="640" ry="55" fill="#c9a06a" opacity="0.4" />
      <g transform="translate(560,260)">
        <rect x="0" y="70" width="220" height="30" rx="12" fill="#8a5a34" />
        <path d="M10 100 L210 100 L192 280 L28 280 Z" fill="#a8672f" />
        <circle cx="110" cy="30" r="58" fill="#3d8f39" />
        <circle cx="60" cy="55" r="36" fill="#5eae59" />
        <circle cx="160" cy="55" r="36" fill="#5eae59" />
      </g>
      <g transform="translate(840,320)">
        <rect x="0" y="46" width="150" height="20" rx="8" fill="#5b3a22" />
        <path d="M6 66 L144 66 L130 220 L20 220 Z" fill="#7a4d2b" />
        <path d="M75 46 C75 -30 130 -40 140 -10" fill="none" stroke="#2c722a" strokeWidth="12" strokeLinecap="round" />
        <path d="M75 46 C75 -20 30 -35 15 -10" fill="none" stroke="#3d8f39" strokeWidth="12" strokeLinecap="round" />
      </g>
      <g transform="translate(250,340)">
        <rect x="0" y="40" width="130" height="18" rx="8" fill="#c96b3f" />
        <path d="M6 58 L124 58 L112 190 L18 190 Z" fill="#e08a52" />
        <circle cx="65" cy="10" r="48" fill="#5eae59" />
      </g>
    </svg>
  );
}

export function ToolsVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tools-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dcf0da" />
          <stop offset="100%" stopColor="#8fcc89" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#tools-bg)" />
      <ellipse cx="600" cy="560" rx="640" ry="55" fill="#5c9d57" opacity="0.35" />
      <g transform="translate(160,300)">
        <rect x="0" y="60" width="220" height="150" rx="10" fill="#8a5a34" />
        <ellipse cx="110" cy="60" rx="110" ry="26" fill="#a8672f" />
        <ellipse cx="110" cy="60" rx="70" ry="16" fill="#5b3a22" />
      </g>
      <g transform="translate(560,260) rotate(-18)">
        <rect x="0" y="0" width="18" height="180" rx="6" fill="#5b3a22" />
        <path d="M-24 -50 L42 -50 L30 10 L-12 10 Z" fill="#7a7a7a" />
      </g>
      <g transform="translate(720,320) rotate(12)">
        <rect x="0" y="0" width="16" height="150" rx="6" fill="#7a4d2b" />
        <path d="M-10 -18 C-10 -40 26 -40 26 -18 L26 0 L-10 0 Z" fill="#9a9a9a" />
      </g>
      <g transform="translate(900,290)">
        <rect x="0" y="30" width="80" height="60" rx="10" fill="#2c722a" />
        <rect x="60" y="10" width="50" height="14" rx="7" fill="#245a24" transform="rotate(20 60 10)" />
        <circle cx="16" cy="30" r="12" fill="#245a24" />
      </g>
    </svg>
  );
}
