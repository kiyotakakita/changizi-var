/**
 * Changizi Face Schema / Heart-shaped Cognitive Topology (認知的アタリ)
 * Abstract geometric facial topology schema (brow arches, cheek contours, chin convergence)
 * based on cognitive neurobiologist Mark Changizi's facial recognition topology.
 */

import React from 'react';
import { GridColor } from '../../types';

interface GridProps {
  color: GridColor;
  strokeWidth: number;
  showCoordinates: boolean;
  showPowerPoints: boolean;
}

export const ChangiziHeartGrid: React.FC<GridProps> = ({
  color,
  strokeWidth,
  showCoordinates,
  showPowerPoints,
}) => {
  const W = 800;
  const H = 600;
  const cx = W / 2; // 400
  const cy = H / 2; // 300

  // Key facial proportions:
  // Eye horizontal baseline: y = 240
  // Left eye center: x = 320, y = 240
  // Right eye center: x = 480, y = 240
  // Glabella (Between brows): x = 400, y = 210
  // Nose tip: x = 400, y = 320
  // Mouth center: x = 400, y = 390
  // Chin tip (heart bottom apex): x = 400, y = 490

  // The Heart Contour (Changizi Cognitive Topology Schema):
  // Starts at glabella (400, 210), curves up and around left brow/cheek, converges down to chin, then symmetrically up right.
  const heartPath = `
    M 400 215
    C 365 140, 260 140, 250 240
    C 240 320, 310 410, 400 495
    C 490 410, 560 320, 550 240
    C 540 140, 435 140, 400 215
    Z
  `;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="heartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.5" />
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

      {/* Cranial Top Guidance Arc */}
      <ellipse
        cx={cx}
        cy="260"
        rx="180"
        ry="180"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeOpacity="0.3"
      />

      {/* Facial Vertical Meridian (正中軸) */}
      <line
        x1={cx}
        y1="50"
        x2={cx}
        y2="550"
        stroke={color}
        strokeWidth={Math.max(1, strokeWidth * 0.9)}
        strokeDasharray="4 4"
        strokeOpacity="0.75"
      />

      {/* Eye-Axis Horizontal Baseline (瞳孔間水平基準線) */}
      <line
        x1="160"
        y1="240"
        x2="640"
        y2="240"
        stroke={color}
        strokeWidth={Math.max(1, strokeWidth * 0.9)}
        strokeOpacity="0.75"
      />

      {/* Eyebrow Arch Baseline */}
      <path
        d="M 270 200 Q 330 180 385 205"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 1.1}
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M 415 205 Q 470 180 530 200"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 1.1}
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* The Master Changizi Heart Topology Path */}
      <path
        d={heartPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#heartGlow)"
      />

      {/* Facial Triangle (Eyes to Mouth Golden Triangle) */}
      <polygon
        points="320,240 480,240 400,390"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeDasharray="2 3"
        strokeOpacity="0.6"
      />

      {/* Nose Bridge and Alar Width Guide */}
      <line x1="380" y1="320" x2="420" y2="320" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1="230" x2={cx} y2="320" stroke={color} strokeWidth="1.2" strokeOpacity="0.7" />

      {/* Mouth Baseline */}
      <line x1="365" y1="390" x2="435" y2="390" stroke={color} strokeWidth={strokeWidth * 1.2} strokeLinecap="round" />

      {/* Golden Ratio Facial Divisions Height Rulers */}
      {showCoordinates && (
        <g stroke={color} strokeWidth="1" opacity="0.65">
          <line x1="180" y1="200" x2="200" y2="200" />
          <line x1="180" y1="240" x2="200" y2="240" />
          <line x1="180" y1="320" x2="200" y2="320" />
          <line x1="180" y1="390" x2="200" y2="390" />
          <line x1="180" y1="495" x2="200" y2="495" />
          <line x1="190" y1="200" x2="190" y2="495" strokeDasharray="2 2" />
        </g>
      )}

      {/* Eye Reticles & Chin Vertex Targets */}
      {showPowerPoints && (
        <>
          {/* Left Eye Reticle */}
          <g transform="translate(320, 240)">
            <circle cx="0" cy="0" r="14" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="0" cy="0" r="2" fill={color} />
            <line x1="-18" y1="0" x2="-8" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="8" y1="0" x2="18" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="-18" x2="0" y2="-8" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="8" x2="0" y2="18" stroke={color} strokeWidth="1.2" />
            {showCoordinates && (
              <text x="-24" y="-18" fill={color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                EYE-L
              </text>
            )}
          </g>

          {/* Right Eye Reticle */}
          <g transform="translate(480, 240)">
            <circle cx="0" cy="0" r="14" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="0" cy="0" r="2" fill={color} />
            <line x1="-18" y1="0" x2="-8" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="8" y1="0" x2="18" y2="0" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="-18" x2="0" y2="-8" stroke={color} strokeWidth="1.2" />
            <line x1="0" y1="8" x2="0" y2="18" stroke={color} strokeWidth="1.2" />
            {showCoordinates && (
              <text x="8" y="-18" fill={color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                EYE-R
              </text>
            )}
          </g>

          {/* Chin Apex Vertex */}
          <g transform="translate(400, 495)">
            <circle cx="0" cy="0" r="10" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="2 2" />
            <circle cx="0" cy="0" r="3" fill={color} />
            {showCoordinates && (
              <text x="14" y="4" fill={color} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                CHIN APEX
              </text>
            )}
          </g>
        </>
      )}

      {/* Topology info */}
      {showCoordinates && (
        <g fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.8">
          <text x="12" y="24">CHANGIZI HEART SCHEMA (認知的アタリ)</text>
          <text x="12" y={H - 12}>FACIAL COGNITIVE TOPOLOGY</text>
          <text x={W - 160} y={H - 12}>BILATERAL SYMMETRY</text>
        </g>
      )}
    </svg>
  );
};
