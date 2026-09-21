import { MediaSample } from '../types';

export const YOUTUBE_PRESETS: { label: string; url: string; tag: string }[] = [
  {
    label: 'Stanley Kubrick 構図分析 (One-Point Perspective)',
    url: 'https://www.youtube.com/watch?v=flq0t4guSpY',
    tag: '映画・名作',
  },
  {
    label: 'Wes Anderson 完璧なシンメトリーと三分割',
    url: 'https://www.youtube.com/watch?v=1bZg_w9E32U',
    tag: 'シンメトリー',
  },
  {
    label: 'FIFA World Cup VAR 判定ライン解析',
    url: 'https://www.youtube.com/watch?v=kY31Wn8Z8_E',
    tag: 'VAR公式',
  },
  {
    label: 'アニメ・映画における黄金比螺旋カメラワーク',
    url: 'https://www.youtube.com/watch?v=z9b3U2t-uFw',
    tag: '黄金螺旋',
  },
];

export const IMAGE_SAMPLES: MediaSample[] = [
  {
    id: 'portrait-spiral',
    name: '瞳と黄金螺旋ポートレート',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    recommendedGrid: 'fibonacci',
    description: 'モデルの瞳が黄金螺旋の収束点(Eye)に位置するスタジオポートレート',
  },
  {
    id: 'landscape-thirds',
    name: '三分割地平線・静謐な山岳風景',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    recommendedGrid: 'rule_of_thirds',
    description: '水面と山脈が33.3%ラインに調和したクラシック風景構図',
  },
  {
    id: 'architecture-triangles',
    name: '黄金三角形・近代建築の対角動勢',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    recommendedGrid: 'golden_triangle',
    description: '光と影の斜線が90°直交分割線と同期するアーキテクチャスチル',
  },
  {
    id: 'face-changizi',
    name: 'チャンギージー・認知的アタリ人物近接',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    recommendedGrid: 'changizi_heart',
    description: '眉弓から頬・顎先のハート型トポロジーにジャストフィットする顔面アタリ',
  },
  {
    id: 'group-multi-face',
    name: '複数人ポートレート (マルチターゲット追跡)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    recommendedGrid: 'changizi_heart',
    description: '最大4人の顔面を自動検出し、個別のハートアタリとYaw角を同時描画',
  },
];
