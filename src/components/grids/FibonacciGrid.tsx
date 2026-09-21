/**
 * Accurate Golden Spiral & Golden Rectangles (φ = 1.6180339887)
 */

import React from 'react';
import { GridColor } from '../../types';

interface GridProps {
  color: GridColor;
  strokeWidth: number;
  showCoordinates: boolean;
  showPowerPoints: boolean;
}

export const FibonacciGrid: React.FC<GridProps> = ({
  color,
  strokeWidth,
  showCoordinates,
  showPowerPoints,
}) => {
  // Golden rectangle coordinates in a 1000 x 618 canvas
  // 1000 / 618 = 1.6181
  const W = 1000;
  const H = 618;

  // Exact Golden Rectangle Subdivisions:
  // 1. Square 1: x:0, y:0, size: 618
  // 2. Square 2: x:618, y:0, size: 382 (fills 618..1000, 0..382)
  // 3. Square 3: x:764, y:382, size: 236 (fills 764..1000, 382..618)
  // 4. Square 4: x:618, y:472, size: 146 (fills 618..764, 472..618)
  // 5. Square 5: x:618, y:382, size: 90  (fills 618..708, 382..472)
  // 6. Square 6: x:708, y:382, size: 56  (fills 708..764, 382..438)
  // 7. Square 7: x:729, y:438, size: 35

  // Golden Spiral Arc path (composed of precise quarter-circle arcs):
  // Arc 1: (0, 618) -> (618, 0) around (618, 618) r=618
  // Arc 2: (618, 0) -> (1000, 382) around (618, 382) r=382
  // Arc 3: (1000, 382) -> (764, 618) around (764, 382) r=236
  // Arc 4: (764, 618) -> (618, 472) around (764, 472) r=146
  // Arc 5: (618, 472) -> (708, 382) around (708, 472) r=90
  // Arc 6: (708, 382) -> (764, 438) around (708, 438) r=56
  // Arc 7: (764, 438) -> (729, 473) around (729, 438) r=35

  const spiralPath = `
    M 0 618
    A 618 618 0 0 1 618 0
    A 382 382 0 0 1 1000 382
    A 236 236 0 0 1 764 618
    A 146 146 0 0 1 618 472
    A 90 90 0 0 1 708 382
    A 56 56 0 0 1 764 438
    A 35 35 0 0 1 729 473
    A 22 22 0 0 1 707 451
    A 14 14 0 0 1 721 437
  `;

  const eyeX = 724;
  const eyeY = 445;

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
        <filter id="spiralGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer bounding box */}
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H - 2}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1, strokeWidth * 0.75)}
        strokeOpacity="0.6"
      />

      {/* Golden Section Partition Rectangles */}
      <g stroke={color} strokeWidth={Math.max(1, strokeWidth * 0.6)} strokeDasharray="3 3" opacity="0.65">
        {/* Division 1: x = 618 */}
        <line x1="618" y1="0" x2="618" y2={H} />
        {/* Division 2: y = 382 */}
        <line x1="618" y1="382" x2={W} y2="382" />
        {/* Division 3: x = 764 */}
        <line x1="764" y1="382" x2="764" y2={H} />
        {/* Division 4: y = 472 */}
        <line x1="618" y1="472" x2="764" y2="472" />
        {/* Division 5: x = 708 */}
        <line x1="708" y1="382" x2="708" y2="472" />
        {/* Division 6: y = 438 */}
        <line x1="708" y1="438" x2="764" y2="438" />
      </g>

      {/* Diagonal guiding harmonic lines */}
      <line
        x1="0"
        y1="0"
        x2={W}
        y2={H}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 4"
        strokeOpacity="0.35"
      />
      <line
        x1={W}
        y1="0"
        x2="618"
        y2={H}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 4"
        strokeOpacity="0.35"
      />

      {/* The Master Golden Logarithmic Spiral */}
      <path
        d={spiralPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#spiralGlow)"
      />

      {/* Eye of the Spiral (Convergence Core) */}
      {showPowerPoints && (
        <g transform={`translate(${eyeX}, ${eyeY})`}>
          {/* Target Reticle */}
          <circle cx="0" cy="0" r="18" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
          <circle cx="0" cy="0" r="8" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="0" cy="0" r="2.5" fill={color} />
          
          {/* Crosshairs */}
          <line x1="-24" y1="0" x2="-10" y2="0" stroke={color} strokeWidth="1.5" />
          <line x1="10" y1="0" x2="24" y2="0" stroke={color} strokeWidth="1.5" />
          <line x1="0" y1="-24" x2="0" y2="-10" stroke={color} strokeWidth="1.5" />
          <line x1="0" y1="10" x2="0" y2="24" stroke={color} strokeWidth="1.5" />

          {/* Label */}
          {showCoordinates && (
            <g transform="translate(14, -14)">
              <rect x="-2" y="-12" width="100" height="16" rx="2" fill="#09090b" fillOpacity="0.8" stroke={color} strokeWidth="0.8" />
              <text x="4" y="0" fill={color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                SPIRAL EYE (φ)
              </text>
            </g>
          )}
        </g>
      )}

      {/* Ratio markers on edges */}
      {showCoordinates && (
        <g fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.75">
          <text x="622" y="16">61.8% (φ)</text>
          <text x="12" y="604">100.0%</text>
          <text x="940" y="376">38.2%</text>
          <text x="12" y="24">GOLDEN SPIRAL 1:1.618</text>
        </g>
      )}
    </svg>
  );
};
