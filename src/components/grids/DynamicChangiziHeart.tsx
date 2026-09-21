/**
 * Dynamic 3D Changizi Heart Component:
 * Real-time Bezier curve attachment to facial landmarks (10, 127, 356, 234, 454, 152).
 * Automatically adapts to 3D head pose (frontal, 3/4, profile) in real-time.
 * Supports MULTI-TARGET TRACKING (up to 4 faces) simultaneously with distinct colors & HUD tags.
 */

import React from 'react';
import { FaceTrackData, GridColor } from '../../types';
import { SingleChangiziHeartItem } from './SingleChangiziHeartItem';

interface DynamicChangiziHeartProps {
  faceData: FaceTrackData;
  color: GridColor;
  strokeWidth: number;
  opacity: number;
}

export const DynamicChangiziHeart: React.FC<DynamicChangiziHeartProps> = ({
  faceData,
  color,
  strokeWidth,
  opacity,
}) => {
  const { detected, landmarks, pose, changiziFitScore, faces } = faceData;

  if (!detected) {
    return null;
  }

  // If multi-face array is provided and contains faces
  const faceList = faces && faces.length > 0
    ? faces
    : landmarks && landmarks.length >= 468 && pose
    ? [
        {
          id: 1,
          landmarks,
          pose,
          changiziFitScore: changiziFitScore || 85,
          boundingBox: faceData.boundingBox || { x: 0, y: 0, width: 1, height: 1 },
        },
      ]
    : [];

  if (faceList.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <defs>
        {/* Glow filter for cyberpunk VAR HUD */}
        <filter id="var-hud-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulsing gradient for heart fill */}
        <linearGradient id="heart-pulse-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="60%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Multi-Face Loop: Render each face with its own Changizi Heart & Yaw tag */}
      {faceList.map((f, idx) => (
        <SingleChangiziHeartItem
          key={f.id || idx}
          landmarks={f.landmarks}
          pose={f.pose}
          changiziFitScore={f.changiziFitScore}
          color={color}
          strokeWidth={strokeWidth}
          faceIndex={idx}
          totalFaces={faceList.length}
        />
      ))}
    </svg>
  );
};
