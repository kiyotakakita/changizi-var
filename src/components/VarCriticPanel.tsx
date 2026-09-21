/**
 * VAR / XAI Composition Critic Panel (サッカーVAR解析室 / 映画編集室風)
 * Outputs XAI logs, match gauge, and actionable composition recommendations.
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Share2,
  Sparkles,
  Layers,
  Compass,
  Maximize2,
  Terminal,
  ScanFace,
  Activity,
} from 'lucide-react';
import { VarAnalysisResult } from '../types';
import { sounds } from '../utils/audio';

interface VarCriticPanelProps {
  result: VarAnalysisResult | null;
  isAnalyzing: boolean;
  onReAnalyze: () => void;
  onDownloadSnapshot?: () => void;
}

export const VarCriticPanel: React.FC<VarCriticPanelProps> = ({
  result,
  isAnalyzing,
  onReAnalyze,
  onDownloadSnapshot,
}) => {
  if (isAnalyzing) {
    return (
      <div className="w-full max-w-5xl px-2 mb-8">
        <div className="bg-zinc-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center text-cyan-400 font-mono-hud text-xs font-bold">
                VAR
              </div>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mb-1 font-display tracking-wide">
              VAR 構図トポロジー解析中...
            </h3>
            <p className="text-xs text-zinc-400 max-w-md font-mono-hud">
              エッジ勾配・注視点重心・黄金比収束点のベクトル計算を実行しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full max-w-5xl px-2 mb-8">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
            <Terminal className="w-8 h-8 text-yellow-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-zinc-200 mb-1 font-display">VAR 批評待機中</p>
            <p className="text-xs text-zinc-400 max-w-md">
              上部の「VAR 構図批評 (Analyze)」ボタンを押すと、現在の映像フレームの一致度計算とXAI批評ログが出力されます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    matchScore,
    status,
    statusLabel,
    verdict,
    warning,
    structuralCritique,
    metrics,
    timestamp,
    id,
    gridType,
  } = result;

  const getGridName = () => {
    switch (gridType) {
      case 'fibonacci':
        return '黄金螺旋 (Fibonacci Spiral)';
      case 'golden_triangle':
        return '黄金三角形 (Golden Triangle)';
      case 'rule_of_thirds':
        return '三分割法 (Rule of Thirds)';
      case 'changizi_heart':
        return 'チャンギージー・ハート (Changizi Schema)';
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
          badge: 'bg-emerald-400 text-zinc-950',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        };
      case 'MARGINAL':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400',
          badge: 'bg-yellow-400 text-zinc-950',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        };
      case 'CRITICAL_OFFSET':
        return {
          bg: 'bg-red-500/10 border-red-500/40 text-red-400',
          badge: 'bg-red-500 text-white',
          icon: <XCircle className="w-5 h-5 text-red-400" />,
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="w-full max-w-5xl px-2 mb-8" id="var-critic-results-panel">
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md">
        {/* Header: VAR Match Gauge & Status Stamp */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            {/* Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={matchScore >= 75 ? 'text-cyan-400' : matchScore >= 55 ? 'text-yellow-400' : 'text-red-400'}
                  strokeDasharray={`${matchScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black font-mono-hud text-zinc-100">{matchScore}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold font-mono-hud tracking-wider uppercase ${statusStyle.badge}`}>
                  {statusLabel}
                </span>
                <span className="text-xs font-mono-hud text-zinc-400">
                  [{id}] • {timestamp}
                </span>
              </div>
              <h2 className="text-base font-bold text-zinc-100 font-display">
                {getGridName()} 構図一致度: <span className="text-yellow-400">{matchScore}%</span>
              </h2>
            </div>
          </div>

          {/* Action buttons: Re-Analyze & Export */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {onDownloadSnapshot && (
              <button
                onClick={onDownloadSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
                title="VAR判定証印付きの画像をエクスポート"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>判定画像保存</span>
              </button>
            )}
            <button
              onClick={onReAnalyze}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-xs font-bold transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>再判定</span>
            </button>
          </div>
        </div>

        {/* Middle: XAI Explanations (判定 & 警告・改善) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          {/* Verdict Box */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 font-mono-hud">VAR 焦点判定ログ (VERDICT)</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans">{verdict}</p>
          </div>

          {/* Warning / Adjustment Box */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 font-mono-hud">偏差警告・推奨調整 (OFFSET ADVICE)</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans">{warning}</p>
          </div>
        </div>

        {/* 3D Facial Pose & Changizi Topology Telemetry (When Face Tracking Data Exists) */}
        {result.faceTrackData && result.faceTrackData.detected && (
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3.5 mb-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-300 font-mono-hud tracking-wider">
                  3D FACIAL POSE & CHANGIZI TOPOLOGY TELEMETRY
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono-hud">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  TARGET LOCKED • 468 PTS
                </span>
                <span className="text-zinc-400">
                  チャンギージー適合度: <strong className="text-yellow-400 font-bold">{result.faceTrackData.changiziFitScore}%</strong>
                </span>
              </div>
            </div>

            {/* 3-Axis Head Pose Data Cards */}
            {result.faceTrackData.pose && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-cyan-500/20">
                  <div className="text-[10px] text-zinc-400 font-mono-hud mb-0.5">姿勢判定 (POSE)</div>
                  <div className="font-bold text-zinc-100 font-mono-hud">{result.faceTrackData.pose.poseLabel}</div>
                  <div className="text-[10px] text-cyan-400 mt-0.5">{result.faceTrackData.pose.lookDirection}</div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-cyan-500/20">
                  <div className="text-[10px] text-zinc-400 font-mono-hud mb-0.5">YAW (左右旋回)</div>
                  <div className="font-bold text-yellow-400 font-mono-hud">{result.faceTrackData.pose.yaw > 0 ? `+${result.faceTrackData.pose.yaw}°` : `${result.faceTrackData.pose.yaw}°`}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {Math.abs(result.faceTrackData.pose.yaw) < 14 ? '正面正対' : result.faceTrackData.pose.yaw > 0 ? '右向き' : '左向き'}
                  </div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-cyan-500/20">
                  <div className="text-[10px] text-zinc-400 font-mono-hud mb-0.5">PITCH (上下仰角)</div>
                  <div className="font-bold text-cyan-400 font-mono-hud">{result.faceTrackData.pose.pitch > 0 ? `+${result.faceTrackData.pose.pitch}°` : `${result.faceTrackData.pose.pitch}°`}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {Math.abs(result.faceTrackData.pose.pitch) < 8 ? '水平アイライン' : result.faceTrackData.pose.pitch > 0 ? 'あおり(上向)' : '俯瞰(下向)'}
                  </div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-cyan-500/20">
                  <div className="text-[10px] text-zinc-400 font-mono-hud mb-0.5">ROLL (画面内回転)</div>
                  <div className="font-bold text-purple-400 font-mono-hud">{result.faceTrackData.pose.roll}°</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {Math.abs(result.faceTrackData.pose.roll) < 5 ? '水平維持' : 'ダッチアングル'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Structural Critique & Theory */}
        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3 mb-4 text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300 font-semibold mr-1.5">【幾何学トポロジー解説】:</span>
          {structuralCritique}
        </div>

        {/* Bottom: Detailed Telemetry Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          {/* Metric 1 */}
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>焦点合致度</span>
              <span className="font-mono-hud text-zinc-200">{metrics.focalAlignment}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${metrics.focalAlignment}%` }} />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>基準水平軸偏差</span>
              <span className="font-mono-hud text-zinc-200">{metrics.horizonDeviation > 0 ? `+${metrics.horizonDeviation}%` : `${metrics.horizonDeviation}%`}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${Math.abs(metrics.horizonDeviation) < 5 ? 'bg-emerald-400' : 'bg-yellow-400'}`}
                style={{ width: `${Math.max(10, 100 - Math.abs(metrics.horizonDeviation) * 4)}%` }}
              />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>左右視覚バランス</span>
              <span className="font-mono-hud text-zinc-200">{metrics.massBalance}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${metrics.massBalance}%` }} />
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>黄金比(φ)親和性</span>
              <span className="font-mono-hud text-zinc-200">{metrics.goldenRatioProximity}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${metrics.goldenRatioProximity}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
