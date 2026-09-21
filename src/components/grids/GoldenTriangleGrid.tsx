/**
 * Golden Triangle Grid (黄金三角形)
 * Diagonal axis with perpendicular lines from opposite corners creating harmonious golden ratio triangles.
 */

import React from 'react';
import { GridColor } from '../../types';

interface GridProps {
  color: GridColor;
  strokeWidth: number;
  showCoordinates: boolean;
  showPowerPoints: boolean;
}

export const GoldenTriangleGrid: React.FC<GridProps> = ({
  color,
  strokeWidth,
  showCoordinates,
  showPowerPoints,
}) => {
  const W = 1000;
  const H = 618;

  // Diagonal from (0, H) to (W, 0)
  // Perpendicular from (0, 0):
  const denom = W * W + H * H;
  const p1X = (W * H * H) / denom;
  const p1Y = (W * W * H) / denom;

  // Perpendicular from (W, H):
  const p2X = W - p1X;
  const p2Y = H - p1Y;

  // Angle of main diagonal
  const angleDeg = Math.round((Math.atan2(H, W) * 180) / Math.PI);

  // Mathematical perpendicular unit vectors for exact 90-degree right angles
  const diagLen = Math.hypot(W, H);
  const uX = W / diagLen;
  const uY = -H / diagLen;
  const vX = -H / diagLen;
  const vY = -W / diagLen;
  const s = 18;

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
        <filter id="triGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={color} floodOpacity="0.5" />
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

      {/* Primary Dynamic Diagonal Line */}
      <line
        x1="0"
        y1={H}
        x2={W}
        y2="0"
        stroke={color}
        strokeWidth={strokeWidth * 1.5}
        strokeLinecap="round"
        filter="url(#triGlow)"
      />

      {/* Perpendicular Line 1: From (0,0) to Intersection P1 on Diagonal */}
      <line
        x1="0"
        y1="0"
        x2={p1X}
        y2={p1Y}
        stroke={color}
        strokeWidth={strokeWidth * 1.25}
        strokeLinecap="round"
        filter="url(#triGlow)"
      />

      {/* Perpendicular Line 2: From (W,H) to Intersection P2 on Diagonal */}
      <line
        x1={W}
        y1={H}
        x2={p2X}
        y2={p2Y}
        stroke={color}
        strokeWidth={strokeWidth * 1.25}
        strokeLinecap="round"
        filter="url(#triGlow)"
      />

      {/* Secondary Harmonic Lines */}
      <line
        x1="0"
        y1="0"
        x2={W}
        y2={H}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="3 4"
        strokeOpacity="0.35"
      />
      <line
        x1={p1X}
        y1={p1Y}
        x2={p2X}
        y2={p2Y}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 3"
        strokeOpacity="0.4"
      />

      {/* Right Angle 90deg Square Indicators */}
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.85">
        {/* P1 Right Angle */}
        <path
          d={`
            M ${p1X + s * uX} ${p1Y + s * uY}
            L ${p1X + s * uX + s * vX} ${p1Y + s * uY + s * vY}
            L ${p1X + s * vX} ${p1Y + s * vY}
          `}
        />
        {/* P2 Right Angle */}
        <path
          d={`
            M ${p2X - s * uX} ${p2Y - s * uY}
            L ${p2X - s * uX - s * vX} ${p2Y - s * uY - s * vY}
            L ${p2X - s * vX} ${p2Y - s * vY}
          `}
        />
      </g>

      {/* Intersection Node Reticles */}
      {showPowerPoints && (
        <>
          {/* P1 Node */}
          <g transform={`translate(${p1X}, ${p1Y})`}>
            <circle cx="0" cy="0" r="16" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
            <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill={color} />
            <line x1="-20" y1="0" x2="-9" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="9" y1="0" x2="20" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="-20" x2="0" y2="-9" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="9" x2="0" y2="20" stroke={color} strokeWidth="1.2" />
            {showCoordinates && (
              <g transform="translate(12, -14)">
                <rect x="-2" y="-12" width="80" height="15" rx="2" fill="#09090b" fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
                <text x="3" y="-1" fill={color} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  TRI-NODE α (90°)
                </text>
              </g>
            )}
          </g>

          {/* P2 Node */}
          <g transform={`translate(${p2X}, ${p2Y})`}>
            <circle cx="0" cy="0" r="16" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
            <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill={color} />
            <line x1="-20" y1="0" x2="-9" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="9" y1="0" x2="20" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="-20" x2="0" y2="-9" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="9" x2="0" y2="20" stroke={color} strokeWidth="1.2" />
            {showCoordinates && (
              <g transform="translate(-90, 20)">
                <rect x="-2" y="-12" width="80" height="15" rx="2" fill="#09090b" fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
                <text x="3" y="-1" fill={color} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  TRI-NODE β (90°)
                </text>
              </g>
            )}
          </g>
        </>
      )}

      {/* Information text */}
      {showCoordinates && (
        <g fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.8">
          <text x="12" y="24">GOLDEN TRIANGLES (θ={angleDeg}°)</text>
          <text x="12" y={H - 12}>DIAGONAL V-AXIS</text>
          <text x={W - 140} y={H - 12}>HARMONIC 90° SPLIT</text>
        </g>
      )}
    </svg>
  );
};
