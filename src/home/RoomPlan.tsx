/**
 * Hero drawing: an L-shaped room sketched the way a measurer draws it, with dimension lines.
 * Visitors pick a floor and the room fills with it. Units in the SVG are centimetres.
 */
import { useState } from 'react';

const FLOORS = [
  { key: 'carpet', label: 'Carpet' },
  { key: 'lvt', label: 'LVT' },
  { key: 'wood', label: 'Engineered wood' },
  { key: 'laminate', label: 'Laminate' },
] as const;

type FloorKey = (typeof FLOORS)[number]['key'];

// 420 × 250 + 300 × 115 cm
const AREA = '13.95';
const ROOM = 'M0 0H420V250H300V365H0Z';

function Dim({ d, label, x, y, rotate = 0, delay }: { d: string; label: string; x: number; y: number; rotate?: number; delay: number }) {
  return (
    <g className="rp-dim" style={{ animationDelay: `${delay}ms` }}>
      <path d={d} pathLength={1} style={{ animationDelay: `${delay}ms` }} />
      <g transform={`translate(${x} ${y}) rotate(${rotate})`} className="rp-dim-label" style={{ animationDelay: `${delay + 350}ms` }}>
        <rect x={-34} y={-12} width={68} height={24} rx={2} />
        <text textAnchor="middle" dy="5">
          {label}
        </text>
      </g>
    </g>
  );
}

export default function RoomPlan() {
  const [floor, setFloor] = useState<FloorKey>('carpet');
  const current = FLOORS.find((f) => f.key === floor)!;

  return (
    <figure className="rp">
      <svg viewBox="-80 -70 580 510" role="img" aria-label={`Floor plan of a 13.95 square metre L-shaped living room, filled with ${current.label.toLowerCase()}`}>
        <defs>
          <pattern id="rp-carpet" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#b7a68f" />
            <circle cx="2" cy="3" r="1.3" fill="#c9baa5" />
            <circle cx="7" cy="7" r="1.3" fill="#a5937b" />
            <circle cx="7.5" cy="1.5" r=".9" fill="#c4b49e" />
            <circle cx="2.5" cy="8" r=".9" fill="#ab9a83" />
          </pattern>
          <pattern id="rp-lvt" width="120" height="60" patternUnits="userSpaceOnUse">
            <rect width="120" height="60" fill="#a88a69" />
            <rect y="30" width="120" height="30" fill="#9c7e5e" />
            <path d="M0 .5H120M0 30.5H120M.5 0V30M60.5 30V60" stroke="#6f5840" strokeWidth="1.2" />
          </pattern>
          <pattern id="rp-wood" width="220" height="36" patternUnits="userSpaceOnUse">
            <rect width="220" height="18" fill="#875b39" />
            <rect y="18" width="220" height="18" fill="#93663f" />
            <path d="M0 .5H220M0 18.5H220M.5 0V18M120.5 18V36" stroke="#5a3b24" strokeWidth="1.2" />
            <path d="M10 6Q60 3 110 7T210 5M20 12Q80 14 140 11M30 24Q90 22 150 26T215 25M5 31Q60 33 100 30" stroke="#6e4a2e" strokeWidth=".7" fill="none" />
          </pattern>
          <pattern id="rp-laminate" width="180" height="40" patternUnits="userSpaceOnUse">
            <rect width="180" height="20" fill="#d1b48e" />
            <rect y="20" width="180" height="20" fill="#c4a67f" />
            <path d="M0 .5H180M0 20.5H180M.5 0V20M90.5 20V40" stroke="#9c7f5b" strokeWidth="1" />
            <path d="M8 9H170M14 30H175" stroke="#b9996f" strokeWidth=".6" />
          </pattern>
        </defs>

        {/* Floor */}
        <path key={floor} className="rp-fill" d={ROOM} fill={`url(#rp-${floor})`} />

        {/* Walls */}
        <path className="rp-wall" d={ROOM} />
        {/* Window on the top wall */}
        <rect className="rp-gap" x="150" y="-6" width="150" height="12" />
        <path className="rp-thin" d="M150 -6H300M150 0H300M150 6H300M150 -6V6M300 -6V6" />
        {/* Door on the bottom wall, with its swing */}
        <rect className="rp-gap" x="40" y="359" width="80" height="12" />
        <path className="rp-thin" d="M40 365V285M40 285A80 80 0 0 1 120 365" />

        {/* Extension lines */}
        <path className="rp-ext" d="M0 -10V-50M420 -10V-50M-10 0H-50M-10 365H-50M430 0H470M430 250H470M300 375V410M0 375V410M300 260V295M420 260V295" />

        {/* Dimension lines with architect's ticks */}
        <Dim d="M0 -35H420M-6 -29L6 -41M414 -29L426 -41" label="4.20 m" x={210} y={-35} delay={150} />
        <Dim d="M-35 0V365M-41 6L-29 -6M-41 371L-29 359" label="3.65 m" x={-35} y={182} rotate={-90} delay={350} />
        <Dim d="M455 0V250M449 6L461 -6M449 256L461 244" label="2.50 m" x={455} y={125} rotate={90} delay={550} />
        <Dim d="M300 280H420M294 286L306 274M414 286L426 274" label="1.20 m" x={360} y={280} delay={750} />
        <Dim d="M0 395H300M-6 401L6 389M294 401L306 389" label="3.00 m" x={150} y={395} delay={950} />

        {/* Area tag */}
        <g className="rp-tag" transform="translate(150 150)">
          <rect x="-86" y="-31" width="176" height="62" rx="3" />
          <circle cx="-70" cy="0" r="5" className="rp-tag-hole" />
          <text x="12" y="-6" textAnchor="middle" className="rp-tag-name">
            Living room
          </text>
          <text x="12" y="17" textAnchor="middle" className="rp-tag-area">
            {AREA} m²
          </text>
        </g>
      </svg>

      <figcaption className="rp-picker">
        <span id="rp-picker-label">Try a floor</span>
        <div role="group" aria-labelledby="rp-picker-label">
          {FLOORS.map((f) => (
            <button key={f.key} type="button" aria-pressed={floor === f.key} onClick={() => setFloor(f.key)}>
              <span className={`rp-chip rp-chip-${f.key}`} aria-hidden="true" />
              {f.label}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
