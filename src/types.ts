/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceMode = 'camera' | 'youtube' | 'file' | 'screen';

export type GridType = 'fibonacci' | 'golden_triangle' | 'rule_of_thirds' | 'changizi_heart';

export type GridColor = '#FACC15' | '#06B6D4' | '#FFFFFF' | '#EF4444' | '#10B981';

export type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | '2.39:1' | 'fit';

export interface GridSettings {
  type: GridType;
  flipH: boolean;
  flipV: boolean;
  rotation: number;      // 0 - 360 deg
  scale?: number;        // 0.2 to 3.0 (default 1.0)
  offsetX?: number;      // -100% to +100% relative translation (default 0)
  offsetY?: number;      // -100% to +100% relative translation (default 0)
  opacity: number;       // 0.1 to 1.0
  strokeWidth: number;   // 1 to 6
  color: GridColor;
  showCoordinates: boolean;
  showPowerPoints: boolean;
  autoFaceTrack: boolean; // リアルタイム顔追尾 & 3Dチャンギージーハート吸着
}

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HeadPose {
  yaw: number;     // 左右回転（度） -90 to +90
  pitch: number;   // 上下傾き（度） -90 to +90
  roll: number;    // 面内回転（度） -180 to +180
  poseLabel: 'Frontal (正面)' | 'Three-Quarter (斜め3/4)' | 'Profile (横顔)';
  lookDirection: string;
}

export interface FaceTrackData {
  detected: boolean;
  landmarks: FaceLandmark[] | null;
  pose: HeadPose | null;
  changiziFitScore: number; // 0 - 100%
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  detectedFaceCount?: number;
  faces?: Array<{
    id: number;
    landmarks: FaceLandmark[];
    pose: HeadPose;
    changiziFitScore: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  timestamp?: number;
}

export interface MediaBounds {
  left: number;       // px relative to stage container
  top: number;        // px relative to stage container
  width: number;      // px
  height: number;     // px
  stageWidth: number; // px
  stageHeight: number;// px
}

export interface SalientPoint {
  x: number; // 0.0 - 1.0
  y: number; // 0.0 - 1.0
  weight: number;
  label: string;
}

export interface VarAnalysisResult {
  id: string;
  timestamp: string;
  gridType: GridType;
  matchScore: number; // 0 - 100
  status: 'CONFIRMED' | 'MARGINAL' | 'CRITICAL_OFFSET';
  statusLabel: string;
  verdict: string; // 判定テキスト
  warning: string; // 警告・改善テキスト
  structuralCritique: string; // 幾何学的解説
  metrics: {
    focalAlignment: number;      // 0 - 100%
    horizonDeviation: number;    // % error (+ or -)
    massBalance: number;         // 0 - 100%
    goldenRatioProximity: number;// 0 - 100%
    symmetryScore: number;       // 0 - 100%
  };
  keypoints: SalientPoint[];
  faceTrackData?: FaceTrackData;
  snapshotUrl?: string;
}

export interface MediaSample {
  id: string;
  name: string;
  type: 'image' | 'youtube';
  url: string;
  recommendedGrid: GridType;
  description: string;
}
