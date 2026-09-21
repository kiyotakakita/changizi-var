/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AspectRatio, GridColor, GridSettings, GridType, SourceMode, VarAnalysisResult } from './types';
import { Header } from './components/Header';
import { MediaStage } from './components/MediaStage';
import { GridContainer } from './components/grids/GridContainer';
import { GridControls } from './components/GridControls';
import { VarCriticPanel } from './components/VarCriticPanel';
import { analyzeFrame } from './utils/analyzer';
import { sounds } from './utils/audio';
import { useFaceMesh } from './hooks/useFaceMesh';

export default function App() {
  // Source Mode: Camera, YouTube, or Local File
  const [sourceMode, setSourceMode] = useState<SourceMode>('camera');

  // Aspect Ratio Framing
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Grid Settings (Defaulting autoFaceTrack to true for instant hands-free tracking)
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    type: 'changizi_heart',
    flipH: false,
    flipV: false,
    rotation: 0,
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    opacity: 0.85,
    strokeWidth: 2,
    color: '#FACC15',
    showCoordinates: true,
    showPowerPoints: true,
    autoFaceTrack: true, // リアルタイム顔追尾 & 3Dチャンギージーハート吸着
  });

  // VAR Critic State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [varResult, setVarResult] = useState<VarAnalysisResult | null>(null);

  // References to active media elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // MediaPipe FaceMesh Hook for real-time tracking
  const { isModelLoaded, faceData, detectImage } = useFaceMesh(
    videoRef,
    imageRef,
    gridSettings.autoFaceTrack
  );

  // Run VAR Analysis
  const runVarAnalysis = useCallback(() => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    sounds.playScan();

    // Get current source element
    const sourceEl: HTMLVideoElement | HTMLImageElement | null =
      sourceMode === 'file'
        ? (imageRef.current || videoRef.current)
        : sourceMode === 'camera'
        ? videoRef.current
        : null;

    let snapshotDataUrl: string | undefined = undefined;

    // Capture visual snapshot if possible
    if (sourceEl) {
      try {
        const c = document.createElement('canvas');
        const w = 640;
        const h = 360;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (ctx) {
          if (sourceEl instanceof HTMLVideoElement && sourceEl.videoWidth > 0) {
            ctx.drawImage(sourceEl, 0, 0, w, h);
          } else if (sourceEl instanceof HTMLImageElement && sourceEl.naturalWidth > 0) {
            ctx.drawImage(sourceEl, 0, 0, w, h);
          }
          snapshotDataUrl = c.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        // Cross-origin restriction fallback
      }
    }

    setTimeout(() => {
      const result = analyzeFrame(sourceEl, gridSettings, snapshotDataUrl, faceData);
      setVarResult(result);
      setIsAnalyzing(false);

      if (result.matchScore >= 70) {
        sounds.playConfirmed();
      } else {
        sounds.playWarning();
      }

      // Scroll smoothly to results if on small mobile screen
      setTimeout(() => {
        const panel = document.getElementById('var-critic-results-panel');
        if (panel && window.innerWidth < 768) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }, 600);
  }, [isAnalyzing, sourceMode, gridSettings, faceData]);

  // Keyboard Shortcuts: [H], [V], [R], [G], [F], [A] / [Space]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'H') {
        e.preventDefault();
        sounds.playBlip();
        setGridSettings((prev) => ({ ...prev, flipH: !prev.flipH }));
      } else if (key === 'V') {
        e.preventDefault();
        sounds.playBlip();
        setGridSettings((prev) => ({ ...prev, flipV: !prev.flipV }));
      } else if (key === 'R') {
        e.preventDefault();
        sounds.playBlip();
        setGridSettings((prev) => ({
          ...prev,
          rotation: ((prev.rotation + 90) % 360) as 0 | 90 | 180 | 270,
        }));
      } else if (key === 'G') {
        e.preventDefault();
        sounds.playBlip();
        setGridSettings((prev) => {
          const gridCycle: GridType[] = ['fibonacci', 'golden_triangle', 'rule_of_thirds', 'changizi_heart'];
          const nextIdx = (gridCycle.indexOf(prev.type) + 1) % gridCycle.length;
          return { ...prev, type: gridCycle[nextIdx] };
        });
      } else if (key === 'F') {
        e.preventDefault();
        sounds.playBlip();
        setGridSettings((prev) => ({ ...prev, autoFaceTrack: !prev.autoFaceTrack }));
      } else if (key === 'A' || e.code === 'Space') {
        e.preventDefault();
        runVarAnalysis();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runVarAnalysis]);

  // Export stamped snapshot
  const handleDownloadSnapshot = () => {
    sounds.playBlip();
    const sourceEl = sourceMode === 'file' ? (imageRef.current || videoRef.current) : videoRef.current;
    const canvas = document.createElement('canvas');
    const w = 1280;
    const h = 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Draw source frame if possible
    if (sourceEl) {
      try {
        if (sourceEl instanceof HTMLVideoElement && sourceEl.videoWidth > 0) {
          ctx.drawImage(sourceEl, 0, 0, w, h);
        } else if (sourceEl instanceof HTMLImageElement && sourceEl.naturalWidth > 0) {
          ctx.drawImage(sourceEl, 0, 0, w, h);
        }
      } catch {
        // Fallback banner
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Render VAR Stamp watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(20, h - 80, 520, 60);
    ctx.strokeStyle = gridSettings.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, h - 80, 520, 60);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('GOLDEN VAR • OFFICIAL VERDICT', 40, h - 46);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText(
      `ID: ${varResult?.id || 'VAR-LOG'} | SCORE: ${varResult?.matchScore || 84}% | GRID: ${gridSettings.type.toUpperCase()}`,
      40,
      h - 26
    );

    // Trigger download
    const link = document.createElement('a');
    link.download = `GoldenVAR_${varResult?.id || 'Audit'}_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center">
      {/* Top Navigation Header */}
      <Header
        sourceMode={sourceMode}
        onSelectSourceMode={(mode) => {
          setSourceMode(mode);
          setVarResult(null);
        }}
        aspectRatio={aspectRatio}
        onSelectAspectRatio={setAspectRatio}
      />

      {/* Main Video & Grid Display Stage */}
      <main className="w-full flex flex-col items-center">
        <MediaStage
          sourceMode={sourceMode}
          aspectRatio={aspectRatio}
          onSelectSourceMode={setSourceMode}
          videoRef={videoRef}
          imageRef={imageRef}
          faceData={faceData}
          autoFaceTrack={gridSettings.autoFaceTrack}
          gridSettings={gridSettings}
          onGridSettingsChange={setGridSettings}
          onDetectImage={detectImage}
        >
          {/* Overlay Geometric Grid & 3D Changizi Heart */}
          <GridContainer
            settings={gridSettings}
            isScanning={isAnalyzing}
            faceData={faceData}
          />
        </MediaStage>

        {/* Tactical Grid Controls */}
        <GridControls
          settings={gridSettings}
          onChange={setGridSettings}
          onTriggerAnalyze={runVarAnalysis}
          isAnalyzing={isAnalyzing}
        />

        {/* VAR / XAI Composition Critic Results Panel */}
        <VarCriticPanel
          result={varResult}
          isAnalyzing={isAnalyzing}
          onReAnalyze={runVarAnalysis}
          onDownloadSnapshot={handleDownloadSnapshot}
        />
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl px-4 py-4 text-center text-xs text-zinc-500 border-t border-zinc-900 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Golden VAR / Composition Critic • 認知的トポロジー &amp; 黄金比幾何学解析</span>
          <span className="font-mono-hud text-[11px] text-zinc-600">
            ショートカット: [H] 左右 [V] 上下 [R] 回転 [G] グリッド [F] 顔追尾 [A] VAR判定
          </span>
        </div>
      </footer>
    </div>
  );
}
