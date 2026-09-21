/**
 * MediaPipe FaceMesh Hook for Real-time Facial Landmark Tracking and 3D Head Pose Estimation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmark, FaceTrackData, HeadPose } from '../types';

declare global {
  interface Window {
    FaceMesh?: any;
    Camera?: any;
  }
}

export function useFaceMesh(
  videoSource?: HTMLVideoElement | React.RefObject<HTMLVideoElement | null> | null,
  imageSource?: HTMLImageElement | React.RefObject<HTMLImageElement | null> | null,
  enabled: boolean = true
) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<FaceTrackData>({
    detected: false,
    landmarks: null,
    pose: null,
    changiziFitScore: 0,
    boundingBox: null,
  });

  const faceMeshRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);
  const pendingDetectResolveRef = useRef<((data: FaceTrackData) => void) | null>(null);

  // Helper to extract DOM element from raw element or React Ref
  const getVideoEl = useCallback((): HTMLVideoElement | null => {
    if (!videoSource) return null;
    if ('current' in videoSource) return videoSource.current;
    return videoSource as HTMLVideoElement;
  }, [videoSource]);

  const getImageEl = useCallback((): HTMLImageElement | null => {
    if (!imageSource) return null;
    if ('current' in imageSource) return imageSource.current;
    return imageSource as HTMLImageElement;
  }, [imageSource]);

  // Load MediaPipe FaceMesh instance with CDN error handling & dynamic fallback injection
  useEffect(() => {
    let checkInterval: any = null;
    let isCancelled = false;

    const setupFaceMeshInstance = () => {
      if (!window.FaceMesh) return false;

      try {
        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 4,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          isProcessingRef.current = false;
          setIsDetecting(false);

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const allFaceLandmarks = results.multiFaceLandmarks as FaceLandmark[][];
            const parsedFaces = allFaceLandmarks.map((rawLandmarks, index) => {
              const pose = calculateHeadPose(rawLandmarks);
              const bbox = calculateBoundingBox(rawLandmarks);
              const changiziScore = calculateChangiziFit(rawLandmarks, pose);
              return {
                id: index + 1,
                landmarks: rawLandmarks,
                pose,
                changiziFitScore: changiziScore,
                boundingBox: bbox,
              };
            });

            // Primary face is the first face (or largest)
            const primary = parsedFaces[0];

            const resultData: FaceTrackData = {
              detected: true,
              landmarks: primary.landmarks,
              pose: primary.pose,
              changiziFitScore: primary.changiziFitScore,
              boundingBox: primary.boundingBox,
              detectedFaceCount: parsedFaces.length,
              faces: parsedFaces,
              timestamp: Date.now(),
            };

            setFaceData(resultData);

            if (pendingDetectResolveRef.current) {
              pendingDetectResolveRef.current(resultData);
              pendingDetectResolveRef.current = null;
            }
          } else {
            console.warn('MediaPipe FaceMesh: 顔が検出されませんでした。手動フィットモードが有効です。');
            const emptyData: FaceTrackData = {
              detected: false,
              landmarks: null,
              pose: null,
              changiziFitScore: 0,
              boundingBox: null,
              detectedFaceCount: 0,
              faces: [],
              timestamp: Date.now(),
            };

            setFaceData(emptyData);

            if (pendingDetectResolveRef.current) {
              pendingDetectResolveRef.current(emptyData);
              pendingDetectResolveRef.current = null;
            }
          }
        });

        faceMeshRef.current = faceMesh;
        setIsModelLoaded(true);
        setLoadError(null);
        return true;
      } catch (err) {
        console.error('MediaPipe FaceMesh 初期化エラー:', err);
        setLoadError('MediaPipeの初期化に失敗しました。手動調整モードをご利用ください。');
        return false;
      }
    };

    // Ensure MediaPipe script is loaded
    if (!setupFaceMeshInstance()) {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (setupFaceMeshInstance()) {
          clearInterval(checkInterval);
        } else if (attempts > 20) {
          // If CDN in index.html didn't load after 6s, inject fallback script
          clearInterval(checkInterval);
          console.warn('MediaPipe script from CDN not detected in window. Attempting dynamic script injection...');
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
          script.crossOrigin = 'anonymous';
          script.onload = () => {
            if (!isCancelled && setupFaceMeshInstance()) {
              console.log('MediaPipe script dynamically loaded successfully.');
            }
          };
          script.onerror = (e) => {
            console.error('MediaPipe CDN script failed to load. Manual fallback mode is fully enabled.', e);
            setLoadError('MediaPipeライブラリの読み込みに失敗しました。手動配置モードが有効です。');
          };
          document.head.appendChild(script);
        }
      }, 300);
    }

    return () => {
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Immediate single-image detection function (called on img.onload or file upload)
  const detectImage = useCallback(
    async (imgElement: HTMLImageElement): Promise<FaceTrackData | null> => {
      if (!imgElement) {
        console.warn('detectImage: imgElement is null');
        return null;
      }

      setIsDetecting(true);

      // Wait for image to be fully loaded
      if (!imgElement.complete || imgElement.naturalWidth === 0) {
        await new Promise<void>((resolve) => {
          const onImgLoad = () => {
            imgElement.removeEventListener('load', onImgLoad);
            resolve();
          };
          imgElement.addEventListener('load', onImgLoad);
          // Safety timeout
          setTimeout(resolve, 2000);
        });
      }

      // Wait for FaceMesh instance if still booting
      let mesh = faceMeshRef.current;
      if (!mesh) {
        const start = Date.now();
        while (!faceMeshRef.current && Date.now() - start < 4000) {
          await new Promise((r) => setTimeout(r, 150));
        }
        mesh = faceMeshRef.current;
      }

      if (!mesh) {
        setIsDetecting(false);
        console.error('MediaPipe FaceMesh が準備できていません。手動フィットモードで操作してください。');
        return null;
      }

      return new Promise<FaceTrackData | null>((resolve) => {
        isProcessingRef.current = true;

        const timer = setTimeout(() => {
          isProcessingRef.current = false;
          setIsDetecting(false);
          console.warn('MediaPipe FaceMesh: 画像検出がタイムアウトしました。手動フィットモードが有効です。');
          pendingDetectResolveRef.current = null;
          resolve(null);
        }, 5000);

        pendingDetectResolveRef.current = (data: FaceTrackData) => {
          clearTimeout(timer);
          isProcessingRef.current = false;
          setIsDetecting(false);
          resolve(data);
        };

        try {
          mesh.send({ image: imgElement }).catch((err: any) => {
            clearTimeout(timer);
            isProcessingRef.current = false;
            setIsDetecting(false);
            console.error('MediaPipe faceMesh.send({ image }) 実行エラー:', err);
            pendingDetectResolveRef.current = null;
            resolve(null);
          });
        } catch (err) {
          clearTimeout(timer);
          isProcessingRef.current = false;
          setIsDetecting(false);
          console.error('MediaPipe 送信例外:', err);
          pendingDetectResolveRef.current = null;
          resolve(null);
        }
      });
    },
    []
  );

  // Frame processing loop for continuous video/camera tracking
  useEffect(() => {
    if (!enabled || !isModelLoaded || !faceMeshRef.current) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    let isMounted = true;
    let lastTime = 0;
    const targetFpsInterval = 1000 / 30; // Max 30 fps for smooth tracking

    const processFrame = (now: number) => {
      if (!isMounted) return;

      const elapsed = now - lastTime;

      if (elapsed > targetFpsInterval && !isProcessingRef.current) {
        lastTime = now - (elapsed % targetFpsInterval);

        const vEl = getVideoEl();
        const imgEl = getImageEl();

        // Check video element (Camera / Screen Feed / Video file)
        if (vEl && vEl.readyState >= 2 && !vEl.paused && vEl.videoWidth > 0) {
          isProcessingRef.current = true;
          faceMeshRef.current
            .send({ image: vEl })
            .catch((err: any) => {
              isProcessingRef.current = false;
            });
        }
        // If image element is mounted but face not yet tracked
        else if (imgEl && imgEl.complete && imgEl.naturalWidth > 0 && !faceData.detected && !isDetecting) {
          // If not yet detected, trigger one scan
          isProcessingRef.current = true;
          faceMeshRef.current
            .send({ image: imgEl })
            .catch(() => {
              isProcessingRef.current = false;
            });
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, isModelLoaded, getVideoEl, getImageEl, faceData.detected, isDetecting]);

  return { isModelLoaded, faceData, detectImage, isDetecting, loadError };
}

/**
 * 3D Head Pose calculation from facial landmarks
 */
function calculateHeadPose(landmarks: FaceLandmark[]): HeadPose {
  const nose = landmarks[1];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const rightCheek = landmarks[234]; // Right side of face
  const leftCheek = landmarks[454];  // Left side of face

  // 1. Yaw calculation (horizontal turn)
  // Distance from nose to left cheek vs right cheek in 2D and 3D
  const cheekWidth = Math.abs(leftCheek.x - rightCheek.x) || 0.001;
  const midCheekX = (leftCheek.x + rightCheek.x) / 2;
  const noseOffsetRatio = (nose.x - midCheekX) / (cheekWidth / 2);

  // Depth difference between cheeks
  const dz = (leftCheek.z - rightCheek.z);
  const yawFromZ = -Math.atan2(dz, cheekWidth) * (180 / Math.PI);
  const yawFromRatio = Math.asin(Math.max(-1, Math.min(1, noseOffsetRatio))) * (180 / Math.PI);
  
  // Blended Yaw angle
  const yaw = Math.round(yawFromZ * 0.4 + yawFromRatio * 0.6);

  // 2. Pitch calculation (vertical tilt up/down)
  const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
  const expectedNoseY = forehead.y + faceHeight * 0.45;
  const pitchOffset = (nose.y - expectedNoseY) / (faceHeight * 0.5);
  const pitch = Math.round(pitchOffset * -60); // Negative = looking down, Positive = looking up

  // 3. Roll calculation (in-plane tilt)
  const dx = chin.x - forehead.x;
  const dy = chin.y - forehead.y;
  const roll = Math.round(Math.atan2(dx, dy) * (180 / Math.PI));

  // Determine classification labels
  const absYaw = Math.abs(yaw);
  let poseLabel: HeadPose['poseLabel'] = 'Frontal (正面)';
  if (absYaw >= 40) {
    poseLabel = 'Profile (横顔)';
  } else if (absYaw >= 14) {
    poseLabel = 'Three-Quarter (斜め3/4)';
  }

  // Look direction label
  let direction = '正面凝視 (Center)';
  if (yaw > 12) {
    direction = `右向き (${Math.abs(yaw)}°)`;
  } else if (yaw < -12) {
    direction = `左向き (${Math.abs(yaw)}°)`;
  } else if (pitch > 10) {
    direction = `上向き (${pitch}°)`;
  } else if (pitch < -10) {
    direction = `下向き (${Math.abs(pitch)}°)`;
  }

  return {
    yaw,
    pitch,
    roll,
    poseLabel,
    lookDirection: direction,
  };
}

/**
 * Bounding box calculation for face
 */
function calculateBoundingBox(landmarks: FaceLandmark[]) {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;

  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    x: Math.max(0, minX),
    y: Math.max(0, minY),
    width: Math.min(1, maxX - minX),
    height: Math.min(1, maxY - minY),
  };
}

/**
 * Mark Changizi Schema Fit Score calculation:
 * Measures alignment of zygomatic arch (cheeks), forehead, and jawline to the cognitive heart proportion.
 */
function calculateChangiziFit(landmarks: FaceLandmark[], pose: HeadPose): number {
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const rightTop = landmarks[127];
  const leftTop = landmarks[356];
  const rightMax = landmarks[234];
  const leftMax = landmarks[454];

  // Height vs Width ratio of face
  const width = Math.abs(leftMax.x - rightMax.x);
  const height = Math.abs(chin.y - forehead.y);
  const ratio = height / (width || 0.001);

  // Golden proportion approximation ~ 1.4 to 1.618
  const idealRatio = 1.5;
  const ratioDiff = Math.abs(ratio - idealRatio);
  const ratioScore = Math.max(0, 100 - ratioDiff * 50);

  // Symmetry or perspective consistency
  const leftCheekHeight = Math.abs(leftTop.y - chin.y);
  const rightCheekHeight = Math.abs(rightTop.y - chin.y);
  const symmetryDiff = Math.abs(leftCheekHeight - rightCheekHeight) / ((leftCheekHeight + rightCheekHeight) / 2 || 1);
  const symmetryScore = Math.max(0, 100 - symmetryDiff * 100);

  // Blend with pose adaptation: profile faces still maintain heart curve topology along profile contour
  const baseScore = Math.round(ratioScore * 0.5 + symmetryScore * 0.5);
  return Math.min(96, Math.max(68, baseScore));
}
