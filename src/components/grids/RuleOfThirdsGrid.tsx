/**
 * Rule of Thirds Grid (三分割法) with 4 Power Points & Golden Section comparison
 */

import React from 'react';
import { GridColor } from '../../types';

interface GridProps {
  color: GridColor;
  strokeWidth: number;
  showCoordinates: boolean;
  showPowerPoints: boolean;
}

export const RuleOfThirdsGrid: React.FC<GridProps> = ({
  color,
  strokeWidth,
  showCoordinates,
  showPowerPoints,
}) => {
  const W = 900;
  const H = 600;

  const x1 = W / 3;
  const x2 = (W * 2) / 3;
  const y1 = H / 3;
  const y2 = (H * 2) / 3;

  // Golden section reference lines (38.2% and 61.8%)
  const gx1 = W * 0.382;
  const gx2 = W * 0.618;
  const gy1 = H * 0.382;
  const gy2 = H * 0.618;

  const intersections = [
    { x: x1, y: y1, id: 'TL (1/3, 1/3)' },
    { x: x2, y: y1, id: 'TR (2/3, 1/3)' },
    { x: x1, y: y2, id: 'BL (1/3, 2/3)' },
    { x: x2, y: y2, id: 'BR (2/3, 2/3)' },
  ];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="thirdsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Frame Border */}
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H - 2}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1, strokeWidth * 0.75)}
        strokeOpacity="0.5"
      />

      {/* Subtle Golden Section (φ) Companion Lines */}
      <g stroke={color} strokeWidth="1" strokeDasharray="2 6" strokeOpacity="0.25">
        <line x1={gx1} y1="0" x2={gx1} y2={H} />
        <line x1={gx2} y1="0" x2={gx2} y2={H} />
        <line x1="0" y1={gy1} x2={W} y2={gy1} />
        <line x1="0" y1={gy2} x2={W} y2={gy2} />
      </g>

      {/* Main Thirds Grid Lines */}
      <g stroke={color} strokeWidth={strokeWidth * 1.25} filter="url(#thirdsGlow)">
        {/* Vertical Lines */}
        <line x1={x1} y1="0" x2={x1} y2={H} />
        <line x1={x2} y1="0" x2={x2} y2={H} />
        {/* Horizontal Lines */}
        <line x1="0" y1={y1} x2={W} y2={y1} />
        <line x1="0" y1={y2} x2={W} y2={y2} />
      </g>

      {/* Dead-Center Bullseye Marker */}
      <g transform={`translate(${W / 2}, ${H / 2})`} opacity="0.45">
        <circle cx="0" cy="0" r="12" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke={color} strokeWidth="1" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke={color} strokeWidth="1" />
      </g>

      {/* 4 Power Crash Points (The Intersection nodes where human eyes focus first) */}
      {showPowerPoints &&
        intersections.map((pt, i) => (
          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
            {/* Outer pulsating ring */}
            <circle cx="0" cy="0" r="16" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
            {/* Inner solid ring */}
            <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill={color} />
            {/* Target crosshair marks */}
            <line x1="-22" y1="0" x2="-9" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="9" y1="0" x2="22" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="-22" x2="0" y2="-9" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="9" x2="0" y2="22" stroke={color} strokeWidth="1.2" />

            {showCoordinates && (
              <g transform="translate(14, -12)">
                <rect x="-2" y="-12" width="70" height="15" rx="2" fill="#09090b" fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
                <text x="3" y="-1" fill={color} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  {pt.id}
                </text>
              </g>
            )}
          </g>
        ))}

      {/* Peripheral measurement annotations */}
      {showCoordinates && (
        <g fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.8">
          <text x="12" y="24">RULE OF THIRDS (3×3 GRID)</text>
          <text x={x1 + 6} y="16">33.3%</text>
          <text x={x2 + 6} y="16">66.7%</text>
          <text x="8" y={y1 - 6}>33.3%</text>
          <text x="8" y={y2 - 6}>66.7%</text>
          <text x={W - 130} y={H - 12}>POWER CRASH: 4</text>
        </g>
      )}
    </svg>
  );
};
