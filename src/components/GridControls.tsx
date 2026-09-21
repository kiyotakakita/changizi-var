/**
 * Tactical Grid Controller Bar (Flip H/V, Rotate 90, Opacity, Stroke, Color, Grid selector)
 * Optimized for both desktop and mobile thumb zones.
 */

import React from 'react';
import {
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  Triangle,
  Grid3X3,
  Heart,
  Palette,
  Crosshair,
  Maximize2,
  ScanFace,
} from 'lucide-react';
import { GridColor, GridSettings, GridType } from '../types';
import { sounds } from '../utils/audio';

interface GridControlsProps {
  settings: GridSettings;
  onChange: (settings: GridSettings) => void;
  onTriggerAnalyze: () => void;
  isAnalyzing: boolean;
}

export const GridControls: React.FC<GridControlsProps> = ({
  settings,
  onChange,
  onTriggerAnalyze,
  isAnalyzing,
}) => {
  const { type, flipH, flipV, rotation, opacity, strokeWidth, color, showCoordinates, showPowerPoints, autoFaceTrack } = settings;

  // Grid type options
  const gridOptions: { type: GridType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { type: 'fibonacci', label: '黄金螺旋', icon: <Sparkles className="w-4 h-4" />, shortcut: '1' },
    { type: 'golden_triangle', label: '黄金三角形', icon: <Triangle className="w-4 h-4" />, shortcut: '2' },
    { type: 'rule_of_thirds', label: '三分割法', icon: <Grid3X3 className="w-4 h-4" />, shortcut: '3' },
    { type: 'changizi_heart', label: 'チャンギージー', icon: <Heart className="w-4 h-4" />, shortcut: '4' },
  ];

  // Palette color presets
  const colorOptions: { color: GridColor; name: string; bg: string }[] = [
    { color: '#FACC15', name: '蛍光イエロー', bg: 'bg-yellow-400' },
    { color: '#06B6D4', name: 'シアンブルー', bg: 'bg-cyan-400' },
    { color: '#FFFFFF', name: 'ピュアホワイト', bg: 'bg-white' },
    { color: '#EF4444', name: 'クリムゾンレッド', bg: 'bg-red-500' },
    { color: '#10B981', name: 'ネオングリーン', bg: 'bg-emerald-400' },
  ];

  const handleFlipH = () => {
    sounds.playBlip();
    onChange({ ...settings, flipH: !flipH });
  };

  const handleFlipV = () => {
    sounds.playBlip();
    onChange({ ...settings, flipV: !flipV });
  };

  const handleRotate = () => {
    sounds.playBlip();
    const nextRot = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onChange({ ...settings, rotation: nextRot });
  };

  const handleGridType = (newType: GridType) => {
    sounds.playBlip();
    onChange({ ...settings, type: newType });
  };

  return (
    <div className="w-full max-w-5xl px-2 mt-3 mb-6">
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-3 md:p-4 shadow-xl backdrop-blur-md">
        {/* Row 1: Grid Mode Selector & Primary VAR Analyze CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          {/* Grid Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {gridOptions.map((opt) => {
              const active = type === opt.type;
              return (
                <button
                  key={opt.type}
                  id={`btn-grid-${opt.type}`}
                  onClick={() => handleGridType(opt.type)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span className={active ? 'text-zinc-950' : 'text-zinc-400'}>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span
                    className={`hidden md:inline-block text-[10px] px-1 py-0.2 rounded font-mono-hud ${
                      active ? 'bg-zinc-950/20 text-zinc-900' : 'bg-zinc-700/60 text-zinc-400'
                    }`}
                  >
                    [G]
                  </span>
                </button>
              );
            })}

            {/* AI Face Auto-Track Toggle Button */}
            <button
              id="btn-toggle-facetrack"
              onClick={() => {
                sounds.playBlip();
                onChange({ ...settings, autoFaceTrack: !autoFaceTrack });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                autoFaceTrack
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-400/25 ring-1 ring-cyan-400/40'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
              title="MediaPipe FaceMeshによる3D顔姿勢・チャンギージーハート自動追尾"
            >
              <ScanFace className={`w-4 h-4 ${autoFaceTrack ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
              <span>顔追尾: {autoFaceTrack ? 'ON' : 'OFF'}</span>
              <span
                className={`hidden md:inline-block text-[10px] px-1 py-0.2 rounded font-mono-hud ${
                  autoFaceTrack ? 'bg-cyan-950 text-cyan-300' : 'bg-zinc-700/60 text-zinc-400'
                }`}
              >
                [F]
              </span>
            </button>
          </div>

          {/* Master VAR / XAI Critic Trigger Button */}
          <button
            id="btn-var-analyze"
            onClick={onTriggerAnalyze}
            disabled={isAnalyzing}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-display font-extrabold text-xs tracking-wider uppercase transition cursor-pointer shadow-lg active:scale-95 ${
              isAnalyzing
                ? 'bg-cyan-500 text-zinc-950 animate-pulse'
                : 'bg-cyan-400 hover:bg-cyan-300 text-zinc-950 shadow-cyan-400/20 hover:shadow-cyan-400/30'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'VAR 解析中...' : 'VAR 構図批評 (Analyze)'}</span>
            <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 bg-black/20 rounded font-mono-hud">
              [A]
            </span>
          </button>
        </div>

        {/* Row 2: Transform Controllers (Flip H, Flip V, Rotate) + Adjustment Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center text-xs">
          {/* Quick Transforms: Flip H, Flip V, Rotate 90, Reset */}
          <div className="col-span-1 md:col-span-4 flex items-center gap-1.5 flex-wrap">
            {/* Flip H */}
            <button
              id="btn-flip-h"
              onClick={handleFlipH}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                flipH
                  ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
              }`}
              title="左右反転 (キーボード [H])"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              <span>左右反転</span>
              <span className="text-[10px] text-zinc-400 font-mono-hud">[H]</span>
            </button>

            {/* Flip V */}
            <button
              id="btn-flip-v"
              onClick={handleFlipV}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                flipV
                  ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
              }`}
              title="上下反転 (キーボード [V])"
            >
              <FlipVertical2 className="w-3.5 h-3.5" />
              <span>上下反転</span>
              <span className="text-[10px] text-zinc-400 font-mono-hud">[V]</span>
            </button>

            {/* Rotate 90 */}
            <button
              id="btn-rotate"
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
              title="90度回転 (キーボード [R])"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{rotation}°</span>
              <span className="text-[10px] text-zinc-400 font-mono-hud">[R]</span>
            </button>
          </div>

          {/* Sliders: Opacity & Stroke Width */}
          <div className="col-span-1 md:col-span-5 flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3 py-2">
            {/* Opacity slider */}
            <div className="flex items-center gap-2 w-full sm:w-1/2">
              <span className="text-zinc-400 text-[11px] shrink-0 font-medium">透明度</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => onChange({ ...settings, opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="text-zinc-400 font-mono-hud text-[11px] shrink-0 w-8 text-right">
                {Math.round(opacity * 100)}%
              </span>
            </div>

            {/* Stroke Width slider */}
            <div className="flex items-center gap-2 w-full sm:w-1/2">
              <span className="text-zinc-400 text-[11px] shrink-0 font-medium">線太さ</span>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={strokeWidth}
                onChange={(e) => onChange({ ...settings, strokeWidth: parseFloat(e.target.value) })}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="text-zinc-400 font-mono-hud text-[11px] shrink-0 w-8 text-right">
                {strokeWidth}px
              </span>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div className="col-span-1 md:col-span-3 flex items-center justify-end gap-1.5">
            <span className="text-zinc-500 text-[11px] mr-1 hidden lg:inline font-medium">ライン色:</span>
            {colorOptions.map((c) => {
              const selected = color === c.color;
              return (
                <button
                  key={c.color}
                  onClick={() => {
                    sounds.playBlip();
                    onChange({ ...settings, color: c.color });
                  }}
                  className={`w-6 h-6 rounded-full ${c.bg} transition transform active:scale-95 cursor-pointer relative ${
                    selected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              );
            })}
          </div>
        </div>

        {/* Row 3: Precision Manual Fit Controls (Scale slider, Rotation slider, Position Reset) */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-mono-hud text-[11px] font-bold shrink-0">
              手動フィット調整 (Manual Fit):
            </span>
            <span className="text-zinc-400 text-[10px] hidden sm:inline">
              画面上を直接ドラッグで移動、マウスホイール/ピンチで拡大縮小可能
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scale slider */}
            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-zinc-400 text-[11px] shrink-0 font-medium">倍率</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={settings.scale ?? 1.0}
                onChange={(e) => onChange({ ...settings, scale: parseFloat(e.target.value) })}
                className="w-20 sm:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="text-yellow-400 font-mono-hud text-[11px] shrink-0 w-10 text-right font-bold">
                {Math.round((settings.scale ?? 1.0) * 100)}%
              </span>
            </div>

            {/* Continuous Rotation Slider (0° - 360°) */}
            <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
              <span className="text-zinc-400 text-[11px] shrink-0 font-medium">回転角</span>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotation}
                onChange={(e) => onChange({ ...settings, rotation: parseInt(e.target.value, 10) as any })}
                className="w-20 sm:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="text-zinc-300 font-mono-hud text-[11px] shrink-0 w-8 text-right font-bold">
                {rotation}°
              </span>
            </div>

            {/* Position Offset Reset */}
            <button
              type="button"
              onClick={() => {
                sounds.playBlip();
                onChange({
                  ...settings,
                  offsetX: 0,
                  offsetY: 0,
                  scale: 1.0,
                  rotation: 0,
                });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 font-mono-hud text-[10px] font-bold transition cursor-pointer"
              title="ハートの位置・倍率・回転を中央初期状態に戻す"
            >
              位置・倍率リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
