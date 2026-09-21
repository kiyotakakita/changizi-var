/**
 * Media Stage Component:
 * Handles Camera (in/out), Screen Capture (getDisplayMedia for YouTube/external video),
 * YouTube iframe player, Local Image/Video file playback with frame scrub,
 * and Manual interactive heart fitting (drag, wheel zoom, pinch).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Play,
  Pause,
  Upload,
  Video,
  Youtube,
  Image as ImageIcon,
  SkipBack,
  SkipForward,
  Snowflake,
  AlertCircle,
  ExternalLink,
  MonitorPlay,
  ScreenShare,
  Move,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import { AspectRatio, FaceTrackData, GridSettings, MediaBounds, SourceMode } from '../types';
import { YOUTUBE_PRESETS, IMAGE_SAMPLES } from '../data/samples';
import { sounds } from '../utils/audio';

interface MediaStageProps {
  sourceMode: SourceMode;
  aspectRatio: AspectRatio;
  onSelectSourceMode?: (mode: SourceMode) => void;
  onFrameCaptured?: (dataUrl: string, element: HTMLVideoElement | HTMLImageElement | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  faceData?: FaceTrackData;
  autoFaceTrack?: boolean;
  gridSettings?: GridSettings;
  onGridSettingsChange?: (settings: GridSettings) => void;
  onDetectImage?: (img: HTMLImageElement) => Promise<FaceTrackData | null>;
  onMediaBoundsChange?: (bounds: MediaBounds | null) => void;
  children?: React.ReactNode; // For the Grid overlay!
}

export const MediaStage: React.FC<MediaStageProps> = ({
  sourceMode,
  aspectRatio,
  onSelectSourceMode,
  videoRef,
  imageRef,
  faceData,
  autoFaceTrack = false,
  gridSettings,
  onGridSettingsChange,
  onDetectImage,
  onMediaBoundsChange,
  children,
}) => {
  // Stage container reference for accurate bounding box calculation
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [mediaBounds, setMediaBounds] = useState<MediaBounds | null>(null);

  // Camera state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const freezeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Screen Capture state (for YouTube & external feeds)
  const [screenActive, setScreenActive] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Manual interactive fitting state (for YouTube CORS fallback)
  const [manualFitInteracting, setManualFitInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initOffsetX: number; initOffsetY: number } | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number | null>(null);

  // YouTube state
  const [youtubeInput, setYoutubeInput] = useState('https://www.youtube.com/watch?v=flq0t4guSpY');
  const [youtubeVideoId, setYoutubeVideoId] = useState('flq0t4guSpY');

  // File state
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [fileSrc, setFileSrc] = useState<string>(IMAGE_SAMPLES[0].url);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Parse YouTube video ID
  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : (url.length === 11 ? url : null);
  };

  const handleYoutubeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = extractYoutubeId(youtubeInput);
    if (id) {
      setYoutubeVideoId(id);
      sounds.playBlip();
    }
  };

  // Start Screen Capture
  const startScreenCapture = async () => {
    try {
      setScreenError(null);
      sounds.playScan();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: false,
      });

      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setScreenActive(true);
      if (onSelectSourceMode) {
        onSelectSourceMode('screen');
      }

      // Auto handle stop sharing from browser native UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setScreenActive(false);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        };
      }
    } catch (err: any) {
      console.warn('Screen capture cancelled or failed:', err);
      if (err.name !== 'NotAllowedError') {
        setScreenError('画面取り込みの開始に失敗しました。ブラウザの画面共有権限をご確認ください。');
      }
      setScreenActive(false);
    }
  };

  // Stop Screen Capture
  const stopScreenCapture = () => {
    sounds.playBlip();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current && sourceMode === 'screen') {
      videoRef.current.srcObject = null;
    }
    setScreenActive(false);
    if (onSelectSourceMode) {
      onSelectSourceMode('youtube');
    }
  };

  // Manual transform helpers
  const handleResetManualTransform = () => {
    sounds.playBlip();
    if (gridSettings && onGridSettingsChange) {
      onGridSettingsChange({
        ...gridSettings,
        offsetX: 0,
        offsetY: 0,
        scale: 1.0,
        rotation: 0,
      });
    }
  };

  const handleManualScaleChange = (delta: number) => {
    if (!gridSettings || !onGridSettingsChange) return;
    sounds.playBlip();
    const newScale = Math.min(3.0, Math.max(0.2, (gridSettings.scale ?? 1.0) + delta));
    onGridSettingsChange({
      ...gridSettings,
      scale: parseFloat(newScale.toFixed(2)),
    });
  };

  const handleManualRotateChange = (deg: number) => {
    if (!gridSettings || !onGridSettingsChange) return;
    sounds.playBlip();
    const newRot = ((gridSettings.rotation + deg + 360) % 360);
    onGridSettingsChange({
      ...gridSettings,
      rotation: newRot,
    });
  };

  // Pointer drag events for manual grid fitting
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!gridSettings || !onGridSettingsChange) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: gridSettings.offsetX ?? 0,
      initOffsetY: gridSettings.offsetY ?? 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !gridSettings || !onGridSettingsChange) return;
    const stage = document.getElementById('var-main-stage');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;

    onGridSettingsChange({
      ...gridSettings,
      offsetX: Math.round(dragStartRef.current.initOffsetX + deltaX),
      offsetY: Math.round(dragStartRef.current.initOffsetY + deltaY),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  // Wheel zoom for manual grid fitting
  const handleWheel = (e: React.WheelEvent) => {
    if (!gridSettings || !onGridSettingsChange) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.min(3.0, Math.max(0.2, (gridSettings.scale ?? 1.0) + delta));
    onGridSettingsChange({
      ...gridSettings,
      scale: parseFloat(newScale.toFixed(2)),
    });
  };

  // Touch pinch zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && gridSettings && onGridSettingsChange) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchStartDistRef.current === null) {
        pinchStartDistRef.current = dist;
        pinchStartScaleRef.current = gridSettings.scale ?? 1.0;
      } else if (pinchStartScaleRef.current !== null) {
        const factor = dist / pinchStartDistRef.current;
        const newScale = Math.min(3.0, Math.max(0.2, pinchStartScaleRef.current * factor));
        onGridSettingsChange({
          ...gridSettings,
          scale: parseFloat(newScale.toFixed(2)),
        });
      }
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
    pinchStartScaleRef.current = null;
  };

  // Start / stop camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (sourceMode === 'camera') {
      setCameraError(null);
      navigator.mediaDevices?.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('カメラの起動に失敗しました。ブラウザのカメラ許可設定をご確認ください。');
          setCameraActive(false);
        });
    } else {
      setCameraActive(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sourceMode, facingMode, videoRef]);

  // Toggle Camera Front/Back
  const toggleCameraFacing = () => {
    sounds.playBlip();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Toggle Freeze Frame on camera
  const toggleFreezeFrame = () => {
    sounds.playBlip();
    if (!isFrozen) {
      if (videoRef.current && freezeCanvasRef.current) {
        const canvas = freezeCanvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      setIsFrozen(true);
    } else {
      setIsFrozen(false);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playBlip();
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      setFileType('video');
      setFileSrc(url);
      setIsPlaying(false);
    } else {
      setFileType('image');
      setFileSrc(url);
    }
  };

  // Video play/pause
  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    sounds.playBlip();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Video step forward / backward (frame scrub)
  const stepVideo = (seconds: number) => {
    if (!videoRef.current) return;
    sounds.playBlip();
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  // Format seconds to mm:ss.ff
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // Synchronize media display rect (bounding box & aspect scaling)
  const updateMediaBounds = useCallback(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const stageRect = stageEl.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) return;

    const activeMedia =
      sourceMode === 'file'
        ? fileType === 'image'
          ? imageRef.current
          : videoRef.current
        : sourceMode === 'camera' || sourceMode === 'screen'
        ? videoRef.current
        : null;

    if (!activeMedia) {
      const fullBounds: MediaBounds = {
        left: 0,
        top: 0,
        width: stageRect.width,
        height: stageRect.height,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
      };
      setMediaBounds(fullBounds);
      onMediaBoundsChange?.(fullBounds);
      return;
    }

    const natW =
      (activeMedia as HTMLImageElement).naturalWidth ||
      (activeMedia as HTMLVideoElement).videoWidth ||
      0;
    const natH =
      (activeMedia as HTMLImageElement).naturalHeight ||
      (activeMedia as HTMLVideoElement).videoHeight ||
      0;

    if (!natW || !natH) {
      const fallbackBounds: MediaBounds = {
        left: 0,
        top: 0,
        width: stageRect.width,
        height: stageRect.height,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
      };
      setMediaBounds(fallbackBounds);
      onMediaBoundsChange?.(fallbackBounds);
      return;
    }

    // Accurate object-contain bounding box calculation relative to stage container
    const containerAspect = stageRect.width / stageRect.height;
    const mediaAspect = natW / natH;

    let renderW = stageRect.width;
    let renderH = stageRect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (mediaAspect > containerAspect) {
      // Media is wider: letterbox on top & bottom
      renderW = stageRect.width;
      renderH = stageRect.width / mediaAspect;
      offsetY = (stageRect.height - renderH) / 2;
    } else {
      // Media is taller: pillarbox on left & right
      renderH = stageRect.height;
      renderW = stageRect.height * mediaAspect;
      offsetX = (stageRect.width - renderW) / 2;
    }

    const bounds: MediaBounds = {
      left: Math.round(offsetX),
      top: Math.round(offsetY),
      width: Math.round(renderW),
      height: Math.round(renderH),
      stageWidth: Math.round(stageRect.width),
      stageHeight: Math.round(stageRect.height),
    };

    setMediaBounds(bounds);
    onMediaBoundsChange?.(bounds);
  }, [sourceMode, fileType, imageRef, videoRef, onMediaBoundsChange]);

  // Observe stage container resize to recalculate media bounds
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const ro = new ResizeObserver(() => {
      updateMediaBounds();
    });
    ro.observe(stageEl);
    window.addEventListener('resize', updateMediaBounds);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMediaBounds);
    };
  }, [updateMediaBounds]);

  // Handle image load event with immediate MediaPipe detection & bounds sync
  const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    updateMediaBounds();
    if (onDetectImage) {
      try {
        await onDetectImage(img);
      } catch (err) {
        console.error('画像読み込み時のMediaPipe即時顔検出エラー:', err);
      }
    }
  };

  // Trigger detection when sample image is selected or file mode activated
  useEffect(() => {
    if (sourceMode === 'file' && fileType === 'image') {
      const timer = setTimeout(() => {
        if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
          updateMediaBounds();
          if (onDetectImage) {
            onDetectImage(imageRef.current).catch((err) => {
              console.error('画像即時検出エラー:', err);
            });
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [fileSrc, sourceMode, fileType, onDetectImage, imageRef, updateMediaBounds]);

  // Aspect ratio class calculation
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      case '1:1':
        return 'aspect-square';
      case '9:16':
        return 'aspect-[9/16]';
      case '2.39:1':
        return 'aspect-[2.39/1]';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Source Mode Control Bar (YouTube URL / Screen Capture / File Uploader / Camera Sub-bar) */}
      <div className="w-full max-w-5xl mb-3 px-2">
        {/* 1. YOUTUBE MODE BAR */}
        {sourceMode === 'youtube' && (
          <div className="flex flex-col gap-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <form onSubmit={handleYoutubeSubmit} className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-youtube-url"
                    type="text"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="YouTube URL または 動画ID を入力 (例: https://www.youtube.com/watch?v=...)"
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono-hud"
                  />
                </div>
                <button
                  type="submit"
                  id="btn-load-youtube"
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
                >
                  読み込み
                </button>
              </form>

              {/* Screen Capture CTA Button next to YouTube */}
              <button
                type="button"
                id="btn-youtube-screen-capture"
                onClick={startScreenCapture}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold rounded-lg transition shadow-md shadow-cyan-400/20 shrink-0 cursor-pointer"
                title="ブラウザのYouTubeタブを直接取り込んでリアルタイム顔追尾を有効化"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>画面を取り込んで解析 (Screen Capture)</span>
              </button>
            </div>

            {/* CORS Warning & Manual Fit Guideline Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200/90">
              <div className="flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">※YouTubeの仕様上、直接解析できません。</strong>
                  <span className="text-zinc-300"> 上部の「画面を取り込んで解析」を使うか、手動でハートを顔に合わせてください。</span>
                </div>
              </div>

              {/* Toggle between YouTube iframe video interaction and Manual Heart Fitting Overlay */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBlip();
                    setManualFitInteracting(!manualFitInteracting);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    manualFitInteracting
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400 shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title={manualFitInteracting ? '動画操作に切り替え' : 'ハートを手動で被写体に合わせる'}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{manualFitInteracting ? '手動フィット操作中 (ドラッグ可能)' : 'ハート手動位置合わせ'}</span>
                </button>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-none">
              <span className="text-zinc-500 text-[11px] shrink-0 font-medium">プリセット:</span>
              {YOUTUBE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setYoutubeInput(preset.url);
                    const id = extractYoutubeId(preset.url);
                    if (id) {
                      setYoutubeVideoId(id);
                      sounds.playBlip();
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-yellow-400 text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  {preset.tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. SCREEN CAPTURE MODE BAR */}
        {sourceMode === 'screen' && (
          <div className="flex items-center justify-between bg-zinc-900/90 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${screenActive ? 'bg-cyan-400 animate-ping' : 'bg-yellow-400'}`} />
              <div>
                <span className="text-xs font-bold font-mono-hud text-cyan-300">
                  {screenActive ? 'SCREEN CAPTURE ACTIVE (画面取り込み解析中)' : '画面取り込み待機中'}
                </span>
                <p className="text-[10px] text-zinc-400 font-mono-hud">
                  ブラウザのYouTubeタブや外部映像をリアルタイムでMediaPipe顔追尾＆VAR解析しています
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startScreenCapture}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition cursor-pointer"
                title="別の画面やウィンドウを再選択"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>画面再選択</span>
              </button>

              <button
                onClick={stopScreenCapture}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition cursor-pointer"
              >
                <span>取り込み停止</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. FILE MODE BAR */}
        {sourceMode === 'file' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>ファイル選択 (画像/動画)</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-zinc-400 font-mono-hud">
                {fileType === 'video' ? '🎬 動画ファイル' : '🖼️ 画像ファイル'}
              </span>
            </div>

            {/* Image sample selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
              <span className="text-zinc-500 text-[11px] shrink-0">作例:</span>
              {IMAGE_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    sounds.playBlip();
                    setFileType('image');
                    setFileSrc(sample.url);
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-yellow-400 text-[11px] whitespace-nowrap transition cursor-pointer"
                  title={sample.description}
                >
                  {sample.name.split('・')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. CAMERA MODE BAR */}
        {sourceMode === 'camera' && (
          <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-mono-hud text-zinc-300">
                {cameraActive ? `LIVE CAMERA (${facingMode === 'user' ? '内カメラ' : '外カメラ'})` : 'カメラ待機中'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFreezeFrame}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isFrozen
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
                title="フレームを一時静止してじっくり構図検証"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>{isFrozen ? '静止中 (再開)' : 'フレーム固定'}</span>
              </button>

              <button
                onClick={toggleCameraFacing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium transition cursor-pointer"
                title="イン/アウトカメラ切り替え"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>反転切替</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Video/Media Stage Viewport */}
      <div className="w-full max-w-5xl px-2">
        <div
          id="var-main-stage"
          ref={stageRef}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full ${getAspectRatioClasses()} bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center justify-center select-none`}
        >
          {/* 1. CAMERA FEED */}
          {sourceMode === 'camera' && (
            <>
              {cameraError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 max-w-md">
                  <AlertCircle className="w-10 h-10 text-yellow-500 mb-3" />
                  <p className="text-sm font-semibold text-zinc-200 mb-1">カメラアクセス制限</p>
                  <p className="text-xs text-zinc-400 mb-4">{cameraError}</p>
                  <button
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="px-4 py-2 bg-yellow-400 text-zinc-950 rounded-lg text-xs font-bold hover:bg-yellow-300 transition"
                  >
                    再試行
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={updateMediaBounds}
                    className={`w-full h-full object-cover ${isFrozen ? 'hidden' : 'block'}`}
                  />
                  <canvas
                    ref={freezeCanvasRef}
                    className={`w-full h-full object-cover ${isFrozen ? 'block' : 'hidden'}`}
                  />
                </>
              )}
            </>
          )}

          {/* 2. SCREEN CAPTURE FEED (Realtime video stream of YouTube tab/browser window) */}
          {sourceMode === 'screen' && (
            <div className="w-full h-full relative flex items-center justify-center bg-zinc-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={updateMediaBounds}
                className={`w-full h-full object-contain ${screenActive ? 'block' : 'hidden'}`}
              />

              {!screenActive && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 max-w-md">
                  <MonitorPlay className="w-12 h-12 text-cyan-400 mb-3 animate-bounce" />
                  <h4 className="text-sm font-bold text-zinc-100 mb-1 font-display">画面取り込み待機中</h4>
                  <p className="text-xs text-zinc-400 mb-4 font-mono-hud leading-relaxed">
                    ブラウザの「画面共有」ダイアログから、YouTubeや解析したい動画のタブを選択してください。映像ピクセルを直接取得してMediaPipeによる顔追尾が有効になります。
                  </p>
                  <button
                    onClick={startScreenCapture}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-400/25 transition cursor-pointer"
                  >
                    <ScreenShare className="w-4 h-4" />
                    <span>画面取り込みを開始する</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. YOUTUBE IFRAME PLAYER */}
          {sourceMode === 'youtube' && (
            <div className="w-full h-full relative">
              <iframe
                id="var-youtube-iframe"
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=1&enablejsapi=1&rel=0&modestbranding=1`}
                title="YouTube VAR Video"
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* 4. FILE PLAYER (IMAGE OR VIDEO) */}
          {sourceMode === 'file' && (
            <>
              {fileType === 'image' ? (
                <img
                  ref={imageRef}
                  src={fileSrc}
                  alt="構図解析対象スチル"
                  onLoad={handleImageLoad}
                  className="w-full h-full object-contain bg-zinc-950"
                  crossOrigin="anonymous"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={fileSrc}
                  className="w-full h-full object-contain bg-zinc-950"
                  playsInline
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                    updateMediaBounds();
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </>
          )}

          {/* GEOMETRIC GRID OVERLAY LAYER (Injected with real-time mediaBounds) */}
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { mediaBounds } as any)
              : child
          )}

          {/* MANUAL INTERACTIVE FIT TOUCH/MOUSE SURFACE (Fallback mode for dragging & positioning) */}
          <div
            id="var-manual-fit-surface"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`absolute inset-0 z-25 touch-none ${
              isDragging
                ? 'cursor-grabbing'
                : manualFitInteracting || !faceData?.detected
                ? 'cursor-grab'
                : 'pointer-events-none'
            } ${manualFitInteracting ? 'bg-yellow-400/5 ring-1 ring-inset ring-yellow-400/30' : ''}`}
            style={{
              pointerEvents:
                sourceMode === 'youtube'
                  ? manualFitInteracting
                    ? 'auto'
                    : 'none'
                  : manualFitInteracting ||
                    !faceData?.detected ||
                    gridSettings?.scale !== 1.0 ||
                    (gridSettings?.offsetX ?? 0) !== 0 ||
                    (gridSettings?.offsetY ?? 0) !== 0
                  ? 'auto'
                  : 'none',
            }}
          />

          {/* FLOATING MANUAL FIT TOOLBAR (Direct on Stage for effortless drag, scale & rotate) */}
          {gridSettings && (
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 p-1 bg-black/80 backdrop-blur-md rounded-xl border border-zinc-800 text-xs shadow-xl">
              <button
                onClick={() => handleManualScaleChange(-0.1)}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                title="縮小 (マウスホイール下スクロールでも可)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono-hud text-[11px] text-yellow-400 font-bold px-1 min-w-[36px] text-center">
                {Math.round((gridSettings.scale ?? 1.0) * 100)}%
              </span>
              <button
                onClick={() => handleManualScaleChange(0.1)}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                title="拡大 (マウスホイール上スクロールでも可)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />

              <button
                onClick={() => handleManualRotateChange(15)}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                title="15度回転"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetManualTransform}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono-hud text-[10px] font-bold transition cursor-pointer"
                title="位置・倍率・回転を中央初期状態にリセット"
              >
                RESET
              </button>
            </div>
          )}

          {/* Live VAR Studio HUD Overlays */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-wrap items-center gap-2 max-w-[85%]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-zinc-800 text-[11px] font-mono-hud text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${sourceMode === 'screen' ? 'bg-cyan-400 animate-ping' : 'bg-red-500 animate-pulse'}`} />
              <span>{sourceMode === 'screen' ? 'SCREEN FEED' : 'REC VAR • FEED'}</span>
            </div>

            {/* Face Tracking HUD Indicator */}
            {autoFaceTrack && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded backdrop-blur-md border text-[11px] font-mono-hud font-bold transition-all duration-300 ${
                  faceData?.detected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : sourceMode === 'youtube'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-400/40 animate-pulse'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    faceData?.detected
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : sourceMode === 'youtube'
                      ? 'bg-amber-400'
                      : 'bg-yellow-400 animate-ping'
                  }`}
                />
                <span>
                  {faceData?.detected
                    ? (faceData.detectedFaceCount && faceData.detectedFaceCount > 1)
                      ? `🟢 LOCKED: ${faceData.detectedFaceCount} TARGETS • ${
                          faceData.faces
                            ?.map((f, i) => `T${i + 1}:${f.pose.yaw > 0 ? `+${f.pose.yaw}` : f.pose.yaw}°`)
                            .join(' ')
                        }`
                      : `🟢 LOCKED: 1 TARGET • ${faceData.pose?.poseLabel.toUpperCase() || 'FRONTAL'} (YAW ${faceData.pose?.yaw ?? 0}°)`
                    : sourceMode === 'youtube'
                    ? 'YOUTUBE CORS: 画面取り込み または 手動フィット推奨'
                    : '🟡 SEARCHING FACE...'}
                </span>
              </div>
            )}

            {/* Manual Fit Active Indicator / Quick-Toggle Button */}
            <button
              type="button"
              onClick={() => setManualFitInteracting((prev) => !prev)}
              className={`pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono-hud font-bold border transition cursor-pointer ${
                manualFitInteracting
                  ? 'bg-yellow-400 text-zinc-950 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                  : gridSettings?.offsetX !== 0 || gridSettings?.offsetY !== 0 || gridSettings?.scale !== 1
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40'
                  : 'bg-black/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
              title="クリックで手動位置合わせ・ドラッグ移動モードを切り替え"
            >
              <Move className="w-3 h-3" />
              <span>
                {manualFitInteracting
                  ? '手動調整中 (ドラッグ可)'
                  : gridSettings?.offsetX !== 0 || gridSettings?.offsetY !== 0 || gridSettings?.scale !== 1
                  ? `MANUAL: X${gridSettings?.offsetX}% Y${gridSettings?.offsetY}% • ${Math.round((gridSettings?.scale ?? 1) * 100)}%`
                  : '手動フィット'}
              </span>
            </button>

            {isFrozen && (
              <div className="px-2 py-1 rounded bg-cyan-500/80 text-black text-[10px] font-extrabold font-mono-hud tracking-wider">
                FREEZE FRAME
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3 z-30 pointer-events-none flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-zinc-800 text-[11px] font-mono-hud text-yellow-400 font-bold">
              {aspectRatio.toUpperCase()} • 4K DCI
            </div>
          </div>
        </div>

        {/* Video Scrubber & Playback Controls for Local File Video */}
        {sourceMode === 'file' && fileType === 'video' && (
          <div className="mt-2 flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-200">
            <button
              onClick={toggleVideoPlayback}
              className="p-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Frame Scrub Back / Forward */}
            <button
              onClick={() => stepVideo(-0.04)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              title="1コマ戻る (Frame -1)"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => stepVideo(0.04)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              title="1コマ進む (Frame +1)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Scrubber Range */}
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                if (videoRef.current) videoRef.current.currentTime = t;
              }}
              className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />

            <span className="text-xs font-mono-hud text-zinc-400 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
