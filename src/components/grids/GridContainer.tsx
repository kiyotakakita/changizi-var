/**
 * Master Grid Container:
 * Strictly separates rendering pipelines:
 * 1. Changizi Heart: 3D dynamic facial topology mesh attachment (only when type === 'changizi_heart').
 * 2. Fibonacci Grid (Golden Spiral): 100% true Golden Ratio (1 : 1.618034) preservation.
 *    - Full-frame mode: Centered and scaled with geometric aspect ratio intact.
 *    - Snap to Face mode: Convergence point (Spiral Eye) locked directly on the pupil/eye landmark.
 * 3. Golden Triangle: 100% true Golden Ratio (1 : 1.618034) & perpendicular 90° right angles.
 *    - Full-frame mode: Centered with preserved ratio.
 *    - Snap to Face mode: Focal intersection snapped to the eye.
 * 4. Rule of Thirds: Clean 3x3 division with true non-distorted circles.
 *    - Full-frame mode: Uniform 3:2 or frame division.
 *    - Snap to Face mode: Nearest power point aligned to the eye.
 */

import React, { useRef, useEffect, useState } from 'react';
import { FaceTrackData, GridSettings, MediaBounds, FaceLandmark, HeadPose } from '../../types';
import { FibonacciGrid } from './FibonacciGrid';
import { GoldenTriangleGrid } from './GoldenTriangleGrid';
import { RuleOfThirdsGrid } from './RuleOfThirdsGrid';
import { ChangiziHeartGrid } from './ChangiziHeartGrid';
import { DynamicChangiziHeart } from './DynamicChangiziHeart';

interface GridContainerProps {
  settings: GridSettings;
  isScanning?: boolean;
  faceData?: FaceTrackData;
  mediaBounds?: MediaBounds | null;
}

const PHI = 1.6180339887;

/**
 * Calculates the dominant eye or interpupillary midpoint from facial landmarks
 */
function getTargetEye(faceData: FaceTrackData): { x: number; y: number; label: string } {
  const primaryFace = faceData.faces && faceData.faces.length > 0 ? faceData.faces[0] : null;
  const landmarks: FaceLandmark[] | null = primaryFace ? primaryFace.landmarks : faceData.landmarks;
  const pose: HeadPose | null = primaryFace ? primaryFace.pose : faceData.pose;

  if (!landmarks || landmarks.length === 0) {
    return { x: 0.5, y: 0.4, label: 'CENTER' };
  }

  // Right eye pupil: 468 (or 33 outer corner)
  // Left eye pupil: 473 (or 263 outer corner)
  const rEye = landmarks[468] || landmarks[33];
  const lEye = landmarks[473] || landmarks[263];

  if (!rEye && !lEye) {
    return { x: 0.5, y: 0.4, label: 'CENTER' };
  }
  if (rEye && !lEye) return { x: rEye.x, y: rEye.y, label: 'RIGHT EYE' };
  if (!rEye && lEye) return { x: lEye.x, y: lEye.y, label: 'LEFT EYE' };

  // If head has strong yaw turn, snap to dominant/closer eye
  if (pose && pose.yaw > 8) {
    return { x: rEye.x, y: rEye.y, label: 'DOMINANT RIGHT EYE' };
  } else if (pose && pose.yaw < -8) {
    return { x: lEye.x, y: lEye.y, label: 'DOMINANT LEFT EYE' };
  }

  // Otherwise, midpoint of the pupils
  return {
    x: (rEye.x + lEye.x) / 2,
    y: (rEye.y + lEye.y) / 2,
    label: 'PUPIL MIDPOINT',
  };
}

export const GridContainer: React.FC<GridContainerProps> = ({
  settings,
  isScanning,
  faceData,
  mediaBounds,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 618,
  });

  const {
    type,
    flipH,
    flipV,
    rotation,
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    opacity,
    strokeWidth,
    color,
    showCoordinates,
    showPowerPoints,
    autoFaceTrack,
  } = settings;

  // Track real container width & height via ResizeObserver and mediaBounds
  useEffect(() => {
    if (mediaBounds && mediaBounds.width > 0 && mediaBounds.height > 0) {
      setContainerDims({ width: mediaBounds.width, height: mediaBounds.height });
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const updateDims = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || el.clientWidth;
      const h = rect.height || el.clientHeight;
      if (w > 0 && h > 0) {
        setContainerDims({ width: w, height: h });
      }
    };

    updateDims();

    const ro = new ResizeObserver(() => {
      updateDims();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [mediaBounds]);

  const frameW = containerDims.width;
  const frameH = containerDims.height;

  const isFaceDetected = Boolean(
    autoFaceTrack && faceData?.detected && (faceData.landmarks || (faceData.faces && faceData.faces.length > 0))
  );

  // Target eye in media coordinates
  const eyeTarget = isFaceDetected && faceData ? getTargetEye(faceData) : { x: 0.5, y: 0.4, label: '' };
  const targetPxX = eyeTarget.x * frameW;
  const targetPxY = eyeTarget.y * frameH;

  // Face dimensions
  const primaryBbox = (faceData?.faces && faceData.faces[0]?.boundingBox) || faceData?.boundingBox;
  const faceW = (primaryBbox?.width ?? 0.22) * frameW;

  return (
    <div
      ref={containerRef}
      id="var-grid-overlay-container"
      className="absolute pointer-events-none overflow-hidden select-none z-20 flex items-center justify-center transition-all duration-75"
      style={{
        left: mediaBounds ? `${mediaBounds.left}px` : 0,
        top: mediaBounds ? `${mediaBounds.top}px` : 0,
        width: mediaBounds ? `${mediaBounds.width}px` : '100%',
        height: mediaBounds ? `${mediaBounds.height}px` : '100%',
        opacity,
      }}
    >
      {/* ========================================================================= */}
      {/* 1. CHANGIZI HEART: DYNAMIC 3D LANDMARK TOPOLOGY (ONLY FOR changizi_heart) */}
      {/* ========================================================================= */}
      {type === 'changizi_heart' && (
        <>
          {isFaceDetected && faceData ? (
            /* Real-time 3D Bezier mesh attached to face landmarks (multi-target supported) */
            <DynamicChangiziHeart
              faceData={faceData}
              color={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          ) : (
            /* Static fallback when face is not detected */
            <div
              className="transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
              style={{
                width: `${Math.min(frameW, frameH * (800 / 600)) * scale}px`,
                height: `${Math.min(frameW * (600 / 800), frameH) * scale}px`,
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <ChangiziHeartGrid
                color={color}
                strokeWidth={strokeWidth}
                showCoordinates={showCoordinates}
                showPowerPoints={showPowerPoints}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. FIBONACCI GRID (GOLDEN SPIRAL): 100% GOLDEN RATIO PRESERVED             */}
      {/* ========================================================================= */}
      {type === 'fibonacci' && (
        <>
          {isFaceDetected ? (
            /* SNAP TO FACE MODE: Spiral Eye (Convergence Point) locked to pupil */
            (() => {
              // At 100% scale, baseSpiral fills the preview screen width/height nicely without fixed small pixel limits
              const baseSpiralW = Math.min(frameW, frameH * PHI);
              const spiralW = baseSpiralW * scale;
              const spiralH = spiralW / PHI; // Strictly 1 : 1.618034

              // Spiral eye coordinates in SVG viewBox (1000 x 618):
              // eyeX = 724, eyeY = 445
              const normEyeX = 724 / 1000; // 0.724
              const normEyeY = 445 / 618;  // 0.7200647

              // Position container so that the eye is at (targetPxX, targetPxY)
              const leftPx = targetPxX - normEyeX * spiralW + (offsetX / 100) * frameW;
              const topPx = targetPxY - normEyeY * spiralH + (offsetY / 100) * frameH;

              return (
                <div
                  className="absolute pointer-events-none transition-all duration-75"
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${spiralW}px`,
                    height: `${spiralH}px`,
                    // Rotation and scale flip revolve directly around the convergence eye
                    transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rotation}deg)`,
                    transformOrigin: `${normEyeX * 100}% ${normEyeY * 100}%`,
                  }}
                >
                  <FibonacciGrid
                    color={color}
                    strokeWidth={strokeWidth}
                    showCoordinates={showCoordinates}
                    showPowerPoints={showPowerPoints}
                  />

                  {/* High-tech convergence snap lock tag on Eye */}
                  <div
                    className="absolute z-30 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950/90 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    style={{
                      left: `${normEyeX * 100}%`,
                      top: `${normEyeY * 100}%`,
                      transform: 'translate(12px, -18px)',
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap">
                      φ EYE LOCKED ({eyeTarget.label})
                    </span>
                  </div>
                </div>
              );
            })()
          ) : (
            /* NORMAL FULL-FRAME MODE: 100% width/height maximum container fit */
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${(flipH ? -1 : 1) * scale}, ${(flipV ? -1 : 1) * scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <FibonacciGrid
                color={color}
                strokeWidth={strokeWidth}
                showCoordinates={showCoordinates}
                showPowerPoints={showPowerPoints}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. GOLDEN TRIANGLE GRID: 100% RATIO & PERPENDICULAR 90° ANGLES            */}
      {/* ========================================================================= */}
      {type === 'golden_triangle' && (
        <>
          {isFaceDetected ? (
            /* SNAP TO FACE MODE: Primary intersection P2 aligned to pupil */
            (() => {
              const baseTriW = Math.min(frameW, frameH * PHI);
              const triW = baseTriW * scale;
              const triH = triW / PHI; // Strictly 1 : 1.618034

              // Intersection P2 in viewBox (1000 x 618):
              // p2X = 723.61, p2Y = 170.79
              const normP2X = 723.61 / 1000;
              const normP2Y = 170.79 / 618;

              const leftPx = targetPxX - normP2X * triW + (offsetX / 100) * frameW;
              const topPx = targetPxY - normP2Y * triH + (offsetY / 100) * frameH;

              return (
                <div
                  className="absolute pointer-events-none transition-all duration-75"
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${triW}px`,
                    height: `${triH}px`,
                    transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rotation}deg)`,
                    transformOrigin: `${normP2X * 100}% ${normP2Y * 100}%`,
                  }}
                >
                  <GoldenTriangleGrid
                    color={color}
                    strokeWidth={strokeWidth}
                    showCoordinates={showCoordinates}
                    showPowerPoints={showPowerPoints}
                  />

                  {/* HUD tag on intersection */}
                  <div
                    className="absolute z-30 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950/90 border border-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                    style={{
                      left: `${normP2X * 100}%`,
                      top: `${normP2Y * 100}%`,
                      transform: 'translate(10px, -18px)',
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold text-yellow-300 whitespace-nowrap">
                      TRIANGLE P2 LOCKED ({eyeTarget.label})
                    </span>
                  </div>
                </div>
              );
            })()
          ) : (
            /* NORMAL FULL-FRAME MODE: 100% width/height maximum container fit */
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${(flipH ? -1 : 1) * scale}, ${(flipV ? -1 : 1) * scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <GoldenTriangleGrid
                color={color}
                strokeWidth={strokeWidth}
                showCoordinates={showCoordinates}
                showPowerPoints={showPowerPoints}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. RULE OF THIRDS GRID: CLEAN 3x3 WITH TRUE CIRCULAR POWER POINTS          */}
      {/* ========================================================================= */}
      {type === 'rule_of_thirds' && (
        <>
          {isFaceDetected ? (
            /* SNAP TO FACE MODE: Nearest upper power point snapped to eye */
            (() => {
              const rotW = Math.min(frameW, frameH * 1.5) * scale;
              const rotH = rotW / 1.5;

              // Choose TL (1/3, 1/3) or TR (2/3, 1/3) based on eye position
              const normX = targetPxX < frameW / 2 ? 1 / 3 : 2 / 3;
              const normY = 1 / 3;

              const leftPx = targetPxX - normX * rotW + (offsetX / 100) * frameW;
              const topPx = targetPxY - normY * rotH + (offsetY / 100) * frameH;

              return (
                <div
                  className="absolute pointer-events-none transition-all duration-75"
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${rotW}px`,
                    height: `${rotH}px`,
                    transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rotation}deg)`,
                    transformOrigin: `${normX * 100}% ${normY * 100}%`,
                  }}
                >
                  <RuleOfThirdsGrid
                    color={color}
                    strokeWidth={strokeWidth}
                    showCoordinates={showCoordinates}
                    showPowerPoints={showPowerPoints}
                  />
                </div>
              );
            })()
          ) : (
            /* NORMAL FULL-FRAME MODE: 100% width/height maximum container fit */
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${(flipH ? -1 : 1) * scale}, ${(flipV ? -1 : 1) * scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <RuleOfThirdsGrid
                color={color}
                strokeWidth={strokeWidth}
                showCoordinates={showCoordinates}
                showPowerPoints={showPowerPoints}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. CYBERPUNK FACE TRACKING BOUNDING RETICLE (Subtle non-intrusive corners) */}
      {/* ========================================================================= */}
      {autoFaceTrack && isFaceDetected && primaryBbox && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {(() => {
            const x = primaryBbox.x * 100;
            const y = primaryBbox.y * 100;
            const w = primaryBbox.width * 100;
            const h = primaryBbox.height * 100;
            const pad = 1.5;
            const bx = Math.max(0, x - pad);
            const by = Math.max(0, y - pad);
            const bw = Math.min(100 - bx, w + pad * 2);
            const bh = Math.min(100 - by, h + pad * 2);
            const cornerSize = Math.min(5, bw * 0.25, bh * 0.25);

            return (
              <g stroke="#06B6D4" strokeWidth="0.35" fill="none" opacity="0.65">
                <path d={`M ${bx} ${by + cornerSize} L ${bx} ${by} L ${bx + cornerSize} ${by}`} />
                <path d={`M ${bx + bw - cornerSize} ${by} L ${bx + bw} ${by} L ${bx + bw} ${by + cornerSize}`} />
                <path d={`M ${bx} ${by + bh - cornerSize} L ${bx} ${by + bh} L ${bx + cornerSize} ${by + bh}`} />
                <path d={`M ${bx + bw - cornerSize} ${by + bh} L ${bx + bw} ${by + bh} L ${bx + bw} ${by + bh - cornerSize}`} />
              </g>
            );
          })()}
        </svg>
      )}

      {/* Frame Corner Viewfinder Brackets (Static HUD Framing) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <g stroke={color} strokeWidth="2" fill="none" opacity="0.6">
          <path d="M 16 36 L 16 16 L 36 16" />
          <path d="M calc(100% - 36px) 16 L calc(100% - 16px) 16 L calc(100% - 16px) 36" />
          <path d="M 16 calc(100% - 36px) L 16 calc(100% - 16px) L 36 calc(100% - 16px)" />
          <path d="M calc(100% - 36px) calc(100% - 16px) L calc(100% - 16px) calc(100% - 16px) L calc(100% - 16px) calc(100% - 36px)" />
        </g>
      </svg>

      {/* High-Tech VAR Laser Scan Bar when analyzing */}
      {isScanning && (
        <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-var-scan z-30 pointer-events-none opacity-90" />
      )}
    </div>
  );
};
