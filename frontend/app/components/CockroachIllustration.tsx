export default function CockroachIllustration() {
  return (
    <svg
      viewBox="0 0 520 480"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto drop-shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
      aria-label="Летящий таракан-курьер с письмом"
    >
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F4F4F4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C4A1E" />
          <stop offset="100%" stopColor="#3D210C" />
        </linearGradient>
        <linearGradient id="bellyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A26937" />
          <stop offset="100%" stopColor="#6E3F18" />
        </linearGradient>
        <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E0E5EE" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="vest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#F2B900" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="220" r="220" fill="url(#bg)" />

      <g opacity="0.10" fill="#0a0a0a">
        <rect x="60" y="300" width="40" height="120" />
        <rect x="105" y="270" width="30" height="150" />
        <rect x="140" y="320" width="48" height="100" />
        <rect x="195" y="285" width="35" height="135" />
        <rect x="235" y="310" width="42" height="110" />
        <rect x="285" y="265" width="32" height="155" />
        <rect x="325" y="300" width="46" height="120" />
        <rect x="380" y="280" width="34" height="140" />
        <rect x="420" y="305" width="44" height="115" />
      </g>

      <g transform="translate(260,210)">
        <path d="M -50,-20 C -180,-130 -130,30 -40,40 Z" fill="url(#wing)" stroke="#cfd6e0" strokeWidth="1.5"/>
        <path d="M 50,-20 C 180,-130 130,30 40,40 Z" fill="url(#wing)" stroke="#cfd6e0" strokeWidth="1.5"/>
        <g stroke="#b9c3cf" strokeWidth="0.8" fill="none" opacity="0.7">
          <path d="M -50,-10 C -100,-50 -130,-30 -60,30" />
          <path d="M -40,0 C -90,-30 -110,-10 -50,30" />
          <path d="M  50,-10 C 100,-50 130,-30 60,30" />
          <path d="M  40,0 C 90,-30 110,-10 50,30" />
        </g>
      </g>

      <g transform="translate(260,235)">
        <ellipse cx="0" cy="40" rx="80" ry="60" fill="url(#bellyG)" />
        <g stroke="#3D210C" strokeWidth="1.2" fill="none" opacity="0.5">
          <path d="M -60,30 Q 0,55 60,30" />
          <path d="M -65,55 Q 0,80 65,55" />
          <path d="M -55,80 Q 0,100 55,80" />
        </g>

        <ellipse cx="0" cy="-20" rx="65" ry="50" fill="url(#body)" />
        <ellipse cx="-22" cy="-40" rx="22" ry="10" fill="#fff" opacity="0.18" />

        <path d="M -55,-30 L 55,-30 L 50,30 L -50,30 Z" fill="url(#vest)" stroke="#C99A00" strokeWidth="1.2" />
        <text x="0" y="5" textAnchor="middle" fontSize="20" fontWeight="800" fill="#3D210C" fontFamily="Inter,system-ui,sans-serif">
          YandexBug
        </text>

        <ellipse cx="0" cy="-72" rx="38" ry="32" fill="url(#body)" />
        <g>
          <circle cx="-15" cy="-78" r="11" fill="#0a0a0a" />
          <circle cx="15"  cy="-78" r="11" fill="#0a0a0a" />
          <circle cx="-12" cy="-82" r="3.5" fill="#fff" opacity="0.9" />
          <circle cx="18"  cy="-82" r="3.5" fill="#fff" opacity="0.9" />
          <rect x="-4" y="-80" width="8" height="2" fill="#0a0a0a" />
        </g>

        <g stroke="#2a1707" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M -10,-100 C -40,-150 -90,-160 -130,-130" />
          <path d="M  10,-100 C  40,-150  90,-160  130,-130" />
        </g>

        <g stroke="#2a1707" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M -55,-10 L -120, 20" />
          <path d="M -50, 20 L -130, 70" />
          <path d="M -45, 55 L -110, 110" />
          <path d="M  55,-10 L  120, 20" />
          <path d="M  50, 20 L  130, 70" />
          <path d="M  45, 55 L  110, 110" />
        </g>
      </g>

      <g transform="translate(120,250) rotate(-8)">
        <rect x="-70" y="-45" width="140" height="90" rx="6" fill="#FFFDF6" stroke="#0a0a0a" strokeWidth="2" />
        <path d="M -70,-45 L 0,15 L 70,-45" fill="none" stroke="#0a0a0a" strokeWidth="2" />
        <circle cx="48" cy="-23" r="6" fill="#E11D48" />
      </g>

      <g stroke="#2a1707" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M 210,235 L 165,265" />
        <path d="M 215,255 L 175,290" />
      </g>
    </svg>
  );
}
