/**
 * SingleChangiziHeartItem:
 * Renders an individual 3D Changizi Heart with pose vectors, landmark nodes,
 * eye reticles, and HUD label for a specific detected face.
 */

import React from 'react';
import { FaceLandmark, GridColor, HeadPose } from '../../types';

interface SingleChangiziHeartItemProps {
  landmarks: FaceLandmark[];
  pose: HeadPose;
  changiziFitScore: number;
  color: GridColor;
  strokeWidth: number;
  faceIndex?: number;
  totalFaces?: number;
}

export const SingleChangiziHeartItem: React.FC<SingleChangiziHeartItemProps> = ({
  landmarks,
  pose,
  changiziFitScore,
  color,
  strokeWidth,
  faceIndex = 0,
  totalFaces = 1,
}) => {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  // Key landmark mapping:
  // 10: Forehead top center (valley of heart)
  // 127: Right temple/zygomatic apex (right peak)
  // 356: Left temple/zygomatic apex (left peak)
  // 234: Right ear/cheek maximum width
  // 454: Left ear/cheek maximum width
  // 152: Chin apex (bottom tip of heart)
  // 1: Nose tip
  // 468, 473: Irises (or 33, 263 outer eyes)
  const pTop = landmarks[10];
  const pRightTop = landmarks[127];
  const pLeftTop = landmarks[356];
  const pRightMax = landmarks[234];
  const pLeftMax = landmarks[454];
  const pChin = landmarks[152];
  const pNose = landmarks[1];
  const pRightEye = landmarks[468] || landmarks[33];
  const pLeftEye = landmarks[473] || landmarks[263];

  // Convert normalized [0, 1] coordinates to SVG percentages (0 - 100)
  const pt = (p: { x: number; y: number }) => ({
    x: p.x * 100,
    y: p.y * 100,
  });

  const cTop = pt(pTop);
  const cRTop = pt(pRightTop);
  const cLTop = pt(pLeftTop);
  const cRMax = pt(pRightMax);
  const cLMax = pt(pLeftMax);
  const cChin = pt(pChin);
  const cNose = pt(pNose);
  const cREye = pt(pRightEye);
  const cLEye = pt(pLeftEye);

  // Bezier curve calculations for smooth 3D heart topology:
  const lLobeDx = cLTop.x - cTop.x;
  const cp1Left = {
    x: cTop.x + lLobeDx * 0.25 - (cTop.y - cLTop.y) * 0.4,
    y: cTop.y - Math.abs(lLobeDx) * 0.45,
  };
  const cp2Left = {
    x: cLTop.x - lLobeDx * 0.2,
    y: cLTop.y - Math.abs(lLobeDx) * 0.35,
  };

  const cp1LCheek = {
    x: cLTop.x + (cLMax.x - cLTop.x) * 0.3,
    y: cLTop.y + (cLMax.y - cLTop.y) * 0.4,
  };
  const cp2LCheek = {
    x: cLMax.x,
    y: cLMax.y - (cLMax.y - cLTop.y) * 0.2,
  };

  const cp1LJaw = {
    x: cLMax.x - (cLMax.x - cChin.x) * 0.35,
    y: cLMax.y + (cChin.y - cLMax.y) * 0.5,
  };
  const cp2LJaw = {
    x: cChin.x + (cLMax.x - cChin.x) * 0.25,
    y: cChin.y - (cChin.y - cLMax.y) * 0.15,
  };

  const cp1RJaw = {
    x: cChin.x + (cRMax.x - cChin.x) * 0.25,
    y: cChin.y - (cChin.y - cRMax.y) * 0.15,
  };
  const cp2RJaw = {
    x: cRMax.x - (cRMax.x - cChin.x) * 0.35,
    y: cRMax.y + (cChin.y - cRMax.y) * 0.5,
  };

  const cp1RCheek = {
    x: cRMax.x,
    y: cRMax.y - (cRMax.y - cRTop.y) * 0.2,
  };
  const cp2RCheek = {
    x: cRTop.x + (cRMax.x - cRTop.x) * 0.3,
    y: cRTop.y + (cRMax.y - cRTop.y) * 0.4,
  };

  const rLobeDx = cTop.x - cRTop.x;
  const cp1Right = {
    x: cRTop.x + rLobeDx * 0.2,
    y: cRTop.y - Math.abs(rLobeDx) * 0.35,
  };
  const cp2Right = {
    x: cTop.x - rLobeDx * 0.25 + (cTop.y - cRTop.y) * 0.4,
    y: cTop.y - Math.abs(rLobeDx) * 0.45,
  };

  // Construct complete closed SVG Bezier Path
  const heartPathD = `
    M ${cTop.x} ${cTop.y}
    C ${cp1Left.x} ${cp1Left.y}, ${cp2Left.x} ${cp2Left.y}, ${cLTop.x} ${cLTop.y}
    C ${cp1LCheek.x} ${cp1LCheek.y}, ${cp2LCheek.x} ${cp2LCheek.y}, ${cLMax.x} ${cLMax.y}
    C ${cp1LJaw.x} ${cp1LJaw.y}, ${cp2LJaw.x} ${cp2LJaw.y}, ${cChin.x} ${cChin.y}
    C ${cp1RJaw.x} ${cp1RJaw.y}, ${cp2RJaw.x} ${cp2RJaw.y}, ${cRMax.x} ${cRMax.y}
    C ${cp1RCheek.x} ${cp1RCheek.y}, ${cp2RCheek.x} ${cp2RCheek.y}, ${cRTop.x} ${cRTop.y}
    C ${cp1Right.x} ${cp1Right.y}, ${cp2Right.x} ${cp2Right.y}, ${cTop.x} ${cTop.y}
    Z
  `;

  // Secondary Features (Pupillary Line & Vertical Midline)
  const midlineD = `M ${cTop.x} ${cTop.y} L ${cNose.x} ${cNose.y} L ${cChin.x} ${cChin.y}`;
  const eyeLineD = `M ${cREye.x} ${cREye.y} L ${cLEye.x} ${cLEye.y}`;

  // Key landmark nodes
  const nodes = [
    { label: '#10', pt: cTop },
    { label: '#356', pt: cLTop },
    { label: '#454', pt: cLMax },
    { label: '#152', pt: cChin },
    { label: '#234', pt: cRMax },
    { label: '#127', pt: cRTop },
    { label: '#1', pt: cNose },
  ];

  // Distinct theme hue if multi-face to easily differentiate
  const targetColors = [
    color,
    '#38BDF8', // Cyan 400
    '#F472B6', // Pink 400
    '#A78BFA', // Purple 400
  ];
  const heartColor = targetColors[faceIndex % targetColors.length] || color;

  // Tag position: clamp within SVG frame
  const tagX = Math.min(76, Math.max(2, cTop.x + 3));
  const tagY = Math.max(5.5, cTop.y - 3.5);

  return (
    <g className="transition-all duration-75">
      {/* 1. Translucent 3D Facial Volume Fill */}
      <path
        d={heartPathD}
        fill="url(#heart-pulse-gradient)"
        stroke="none"
      />

      {/* 2. Main 3D Bezier Changizi Heart Contour */}
      <path
        d={heartPathD}
        fill="none"
        stroke={heartColor}
        strokeWidth={strokeWidth * 0.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#var-hud-glow)"
      />

      {/* 3. Subtle dashed helper lines (Facial Midline & Pupillary Line) */}
      <path
        d={midlineD}
        fill="none"
        stroke={heartColor}
        strokeWidth={strokeWidth * 0.2}
        strokeDasharray="1, 1.5"
        strokeOpacity="0.7"
      />
      <path
        d={eyeLineD}
        fill="none"
        stroke="#06B6D4"
        strokeWidth={strokeWidth * 0.25}
        strokeDasharray="1, 1"
      />

      {/* 4. Eyes Reticles (Pupils) */}
      <circle cx={cREye.x} cy={cREye.y} r="0.9" fill="#06B6D4" />
      <circle cx={cREye.x} cy={cREye.y} r="1.8" fill="none" stroke="#06B6D4" strokeWidth="0.25" />
      <circle cx={cLEye.x} cy={cLEye.y} r="0.9" fill="#06B6D4" />
      <circle cx={cLEye.x} cy={cLEye.y} r="1.8" fill="none" stroke="#06B6D4" strokeWidth="0.25" />

      {/* 5. Nose Tip 3D Vector Crosshair */}
      <g transform={`translate(${cNose.x}, ${cNose.y})`}>
        <circle r="1.1" fill={heartColor} />
        <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke={heartColor} strokeWidth="0.3" />
        <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke={heartColor} strokeWidth="0.3" />
        {pose && (
          <line
            x1="0"
            y1="0"
            x2={pose.yaw * 0.12}
            y2={pose.pitch * -0.12}
            stroke="#06B6D4"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
        )}
      </g>

      {/* 6. Nodes & Dynamic Coordinates on Vertices */}
      {nodes.map((node, i) => (
        <g key={i}>
          <circle
            cx={node.pt.x}
            cy={node.pt.y}
            r="0.8"
            fill={i === 0 || i === 3 ? '#FACC15' : '#FFFFFF'}
            stroke="#09090B"
            strokeWidth="0.2"
          />
        </g>
      ))}

      {/* 7. Dynamic 3D HUD Pose Tag floating next to face */}
      <g transform={`translate(${tagX}, ${tagY})`}>
        <rect
          x="0"
          y="-3.5"
          width={totalFaces > 1 ? "28" : "26"}
          height="7.5"
          rx="1"
          fill="rgba(9, 9, 11, 0.88)"
          stroke={heartColor}
          strokeWidth="0.3"
        />
        {/* Header line with Target # and Fit Score */}
        <text
          x="1.5"
          y="-0.8"
          fill="#06B6D4"
          fontSize="1.9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {totalFaces > 1 ? `T${faceIndex + 1}: ${changiziFitScore}%` : `CHANGIZI: ${changiziFitScore}%`}
        </text>
        {/* Subtitle line with Head Pose and Yaw */}
        <text
          x="1.5"
          y="2.2"
          fill="#FACC15"
          fontSize="1.8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          YAW: {pose?.yaw > 0 ? `+${pose.yaw}` : pose?.yaw}°
        </text>
      </g>
    </g>
  );
};
