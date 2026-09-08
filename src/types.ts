export type PipelineStageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface AiModelOption {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'audio' | 'music' | 'video';
  badge?: string;
  isPaid?: boolean;
}

export type DemoOutputStage = 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6';

export interface DemoSampleOutput<T> {
  stage: DemoOutputStage;
  model: string;
  modelLabel: string;
  estimatedDurationMs: number;
  output: T;
}

export interface ParsedNoteSummary {
  summary: string;
  keyConcepts: string[];
  suggestedTitles: string[];
  difficultyLevel: string;
  coreTakeaway: string;
}

export interface Stage1Data {
  presetId?: string;
  noteContent: string;
  noteFileName?: string;
  noteFileMime?: string;
  noteFileBase64?: string;
  themeIdea: string;
  targetAudience: string;
  visualStyle: string;
  targetDuration: number;
  selectedModel: string;
  parsedOutput?: ParsedNoteSummary;
}

export interface StorylineChapter {
  id: string;
  chapterNumber: number;
  title: string;
  conceptFocus: string;
  narrativeHook: string;
  visualAnimationCue: string;
  interactiveElement?: string;
  durationPercent: number;
}

export interface Stage2Data {
  selectedModel: string;
  narrativeTone: string;
  chapters: StorylineChapter[];
  totalEstimatedDuration: number;
}

export interface SceneScriptItem {
  id: string;
  sceneNumber: number;
  durationSec: number;
  sceneTitle: string;
  visualDescription: string;
  dialogueNarrative: string;
  cameraAngle: string;
  lightingMood: string;
  bgMusicPrompt: string;
  motionGraphicType: string;
  imagePrompt?: string;
  videoPrompt?: string;
}

export interface Stage3Data {
  selectedModel: string;
  scenes: SceneScriptItem[];
  globalMusicGenre: string;
}

export interface VoiceoverAsset {
  sceneId: string;
  voiceName: string;
  speed: number;
  pitch: number;
  audioDataUrl?: string;
  isGenerating?: boolean;
}

export interface Stage4Data {
  selectedModel: string;
  selectedVoice: string;
  voiceoverAssets: Record<string, VoiceoverAsset>;
  bgMusicDataUrl?: string;
  bgMusicTitle?: string;
  bgMusicVolume: number;
  isMusicGenerating?: boolean;
}

export interface SceneImageAsset {
  sceneId: string;
  prompt: string;
  imageUrl?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  isGenerating?: boolean;
  customStyleOverride?: string;
  modelUsed?: string;
}

export interface Stage5Data {
  selectedModel: string;
  sceneImages: Record<string, SceneImageAsset>;
  globalAspectRatio: '16:9' | '9:16' | '1:1';
}

export interface Stage6Data {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isExporting: boolean;
  exportProgress: number;
  exportedVideoUrl?: string;
  captionStyle: 'Bold Pop-up' | 'Classic Subtitle' | 'Karaoke Highlight' | 'Minimalist Bottom';
  showMotionGraphics: boolean;
  playbackSpeed: number;
  sceneVideos?: Record<string, SceneVideoAsset>;
  composition?: TimelineComposition;
}

export interface TimelineNarrationClip {
  id: string;
  sceneId: string;
  sourceUrl?: string;
  text: string;
  startOffsetSec: number;
  trimStartSec: number;
  trimEndSec: number;
  sourceDurationSec?: number;
}

export interface TimelineSubtitleClip {
  id: string;
  sceneId: string;
  text: string;
  startOffsetSec: number;
  endOffsetSec: number;
}

export interface TimelineSceneClip {
  id: string;
  sceneId: string;
  sceneNumber: number;
  title: string;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  sourceDurationSec?: number;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  narration: TimelineNarrationClip;
  subtitle: TimelineSubtitleClip;
  subtitles?: TimelineSubtitleClip[];
}

export interface TimelineComposition {
  version: 1;
  aspectRatio: '16:9' | '9:16';
  scenes: TimelineSceneClip[];
  backgroundAudio?: {
    sourceUrl: string;
    title: string;
    volume: number;
  };
}

export interface SceneVideoAsset {
  sceneId: string;
  prompt: string;
  videoUrl?: string;
  isGenerating?: boolean;
  modelUsed?: string;
  error?: string;
}

export interface PresetSampleNote {
  id: string;
  title: string;
  subject: string;
  iconName: string;
  content: string;
  suggestedTheme: string;
}
