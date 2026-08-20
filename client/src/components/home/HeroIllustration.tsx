export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} role="img" aria-label="Potted plants and gardening tools in a sunlit home garden">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf6e8" />
          <stop offset="100%" stopColor="#c9e8c4" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" rx="20" fill="url(#hero-sky)" />
      <circle cx="540" cy="90" r="46" fill="#ffd77a" />
      <ellipse cx="320" cy="430" rx="300" ry="26" fill="#8fcc89" opacity="0.5" />

      {/* Large ceramic planter with plant */}
      <g transform="translate(120,220)">
        <path d="M10 60 L190 60 L170 200 L30 200 Z" fill="#c96b3f" />
        <rect x="0" y="40" width="200" height="26" rx="10" fill="#a8552f" />
        <path d="M60 40 C60 -40 140 -40 140 40" fill="none" stroke="#2c722a" strokeWidth="14" strokeLinecap="round" />
        <path d="M100 40 C90 -60 60 -70 40 -50" fill="none" stroke="#3d8f39" strokeWidth="12" strokeLinecap="round" />
        <path d="M100 40 C110 -70 150 -80 165 -55" fill="none" stroke="#5eae59" strokeWidth="12" strokeLinecap="round" />
      </g>

      {/* Small terracotta pot */}
      <g transform="translate(360,290)">
        <path d="M8 30 L132 30 L118 130 L22 130 Z" fill="#e08a52" />
        <rect x="0" y="14" width="140" height="20" rx="8" fill="#c96b3f" />
        <circle cx="70" cy="-10" r="46" fill="#5eae59" />
        <circle cx="40" cy="10" r="30" fill="#3d8f39" />
        <circle cx="100" cy="10" r="30" fill="#3d8f39" />
      </g>

      {/* Watering can */}
      <g transform="translate(440,340)">
        <rect x="0" y="20" width="90" height="55" rx="10" fill="#2c722a" />
        <rect x="70" y="0" width="55" height="16" rx="8" fill="#245a24" transform="rotate(20 70 0)" />
        <circle cx="20" cy="20" r="14" fill="#245a24" />
      </g>

      {/* Grow bag */}
      <g transform="translate(60,330)">
        <path d="M0 20 L80 20 L74 90 L6 90 Z" fill="#4a4a4a" opacity="0.85" />
        <rect x="-4" y="8" width="88" height="16" rx="6" fill="#333333" />
      </g>
    </svg>
  );
}
