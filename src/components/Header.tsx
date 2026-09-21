/**
 * Golden VAR Top Navigation & Source Mode Selector Header
 */

import React, { useState } from 'react';
import {
  Camera,
  Youtube,
  FolderOpen,
  Volume2,
  VolumeX,
  Keyboard,
  Info,
  Ratio,
  X,
  Sparkles,
  MonitorPlay,
} from 'lucide-react';
import { AspectRatio, SourceMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { sounds } from '../utils/audio';

interface HeaderProps {
  sourceMode: SourceMode;
  onSelectSourceMode: (mode: SourceMode) => void;
  aspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sourceMode,
  onSelectSourceMode,
  aspectRatio,
  onSelectAspectRatio,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playBlip();
  };

  const aspectOptions: AspectRatio[] = ['16:9', '4:3', '1:1', '9:16', '2.39:1'];

  return (
    <header className="w-full max-w-5xl px-2 pt-3 pb-2 flex flex-col gap-2.5">
      {/* Top Brand Bar & Global Tools */}
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/20 text-zinc-950 font-black text-sm tracking-tighter">
            φ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm md:text-base tracking-wider text-zinc-100 uppercase">
                GOLDEN <span className="text-yellow-400">VAR</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono-hud text-zinc-400 font-bold border border-zinc-700">
                PRO 2.4
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              リアルタイム幾何学グリッド &amp; XAI構図批評スタジオ
            </p>
          </div>
        </div>

        {/* Action icons & PWA button */}
        <div className="flex items-center gap-1.5">
          {/* Aspect Ratio Selector */}
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <Ratio className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5" />
            <select
              value={aspectRatio}
              onChange={(e) => {
                sounds.playBlip();
                onSelectAspectRatio(e.target.value as AspectRatio);
              }}
              className="bg-transparent text-[11px] font-mono-hud text-zinc-300 py-1 pl-1 pr-2 focus:outline-none cursor-pointer"
            >
              {aspectOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-900 text-zinc-200">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
            title={soundEnabled ? '音声をミュート' : '音声を有効化'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Keyboard Shortcuts Dialog */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer hidden md:flex items-center"
            title="キーボードショートカット一覧"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* In-app PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Source Mode Tabs (カメラ / YouTube / 画面取り込み / ファイル) */}
      <div className="flex items-center justify-between gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 w-full gap-1">
          {/* Camera Mode */}
          <button
            id="tab-source-camera"
            onClick={() => {
              sounds.playBlip();
              onSelectSourceMode('camera');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sourceMode === 'camera'
                ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>カメラ映像</span>
          </button>

          {/* YouTube Mode */}
          <button
            id="tab-source-youtube"
            onClick={() => {
              sounds.playBlip();
              onSelectSourceMode('youtube');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sourceMode === 'youtube'
                ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </button>

          {/* Screen Capture Mode */}
          <button
            id="tab-source-screen"
            onClick={() => {
              sounds.playBlip();
              onSelectSourceMode('screen');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sourceMode === 'screen'
                ? 'bg-cyan-400 text-zinc-950 shadow-sm shadow-cyan-400/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>画面取り込み</span>
          </button>

          {/* File Mode */}
          <button
            id="tab-source-file"
            onClick={() => {
              sounds.playBlip();
              onSelectSourceMode('file');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sourceMode === 'file'
                ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>ファイル</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold font-display">キーボードショートカット</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">グリッド左右反転 (Flip H)</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-yellow-400 rounded font-mono-hud font-bold">H</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">グリッド上下反転 (Flip V)</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-yellow-400 rounded font-mono-hud font-bold">V</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">90度時計回り回転 (Rotate)</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-yellow-400 rounded font-mono-hud font-bold">R</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">幾何学グリッド循環切り替え</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-yellow-400 rounded font-mono-hud font-bold">G</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">顔自動追尾 ON/OFF</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-yellow-400 rounded font-mono-hud font-bold">F</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">手動フィット (移動・拡大縮小)</span>
                <span className="text-[11px] text-zinc-400 font-mono-hud">ドラッグ移動 / ホイール拡大縮小</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-300">VAR 構図批評の実行</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 text-cyan-400 rounded font-mono-hud font-bold">A または Space</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="mt-5 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-semibold text-zinc-200 transition cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
