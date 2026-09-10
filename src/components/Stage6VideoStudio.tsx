import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Stage1Data,
  Stage3Data,
  Stage4Data,
  Stage5Data,
  Stage6Data,
  SceneVideoAsset,
  TimelineComposition,
  TimelineSceneClip,
  TimelineSubtitleClip,
} from '../types';
import { ModelSelectorModal } from './ModelSelectorModal';
import { generateSceneSvgDataUrl } from '../utils/svgCanvasGenerator';
import { loadDemoSampleOutput } from '../data/demoRun';
import {
  buildInitialComposition,
  clampTime,
  compositionDuration,
  findSceneAtTime,
  narrationDuration,
  narrationOverlaps,
  reorderScenes,
  sceneOffsets,
} from '../utils/composition';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Link2,
  Mic,
  Monitor,
  Music,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Scissors,
  Sparkles,
  Subtitles,
  Undo2,
  Video,
} from 'lucide-react';

interface Stage6VideoStudioProps {
  stage1Data: Stage1Data;
  stage3Data: Stage3Data;
  stage4Data: Stage4Data;
  stage5Data: Stage5Data;
  data: Stage6Data;
  updateData: (fields: Partial<Stage6Data>) => void;
  onPrevStage: () => void;
}

const PIXELS_PER_SECOND = 18;

export const Stage6VideoStudio: React.FC<Stage6VideoStudioProps> = ({
  stage1Data,
  stage3Data,
  stage4Data,
  stage5Data,
  data,
  updateData,
  onPrevStage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const currentTimeRef = useRef(data.currentTime);
  const lastSceneRef = useRef<string | null>(null);
  const dragSceneRef = useRef<string | null>(null);
  const dragAudioRef = useRef<string | null>(null);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [history, setHistory] = useState<TimelineComposition[]>([]);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [videoModel, setVideoModel] = useState('omni-flash');
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const composition = data.composition;
  const totalDurationSec = compositionDuration(composition);
  const offsets = useMemo(() => composition ? sceneOffsets(composition) : [], [composition]);
  const active = composition ? findSceneAtTime(composition, data.currentTime) : undefined;
  const selectedScene = composition?.scenes.find((scene) => scene.sceneId === selectedSceneId) || composition?.scenes[0];
  const timelineWidth = Math.max(900, totalDurationSec * PIXELS_PER_SECOND);

  useEffect(() => {
    if (!selectedSceneId && composition?.scenes[0]) setSelectedSceneId(composition.scenes[0].sceneId);
  }, [composition, selectedSceneId]);

  const commitComposition = (next: TimelineComposition, recordHistory = true) => {
    if (composition && recordHistory) setHistory((items) => [...items.slice(-19), composition]);
    updateData({ composition: next, currentTime: Math.min(data.currentTime, compositionDuration(next)) });
  };

  const updateScene = (sceneId: string, updater: (scene: TimelineSceneClip) => TimelineSceneClip) => {
    if (!composition) return;
    commitComposition({ ...composition, scenes: composition.scenes.map((scene) => scene.sceneId === sceneId ? updater(scene) : scene) });
  };

  const resetTimeline = () => {
    const fresh = buildInitialComposition(stage3Data, stage4Data, stage5Data, data.sceneVideos || {});
    commitComposition(fresh);
    updateData({ currentTime: 0, isPlaying: false });
  };

  const undoTimeline = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    updateData({ composition: previous, currentTime: Math.min(data.currentTime, compositionDuration(previous)) });
  };

  useEffect(() => {
    if (!composition) return;
    let cancelled = false;
    Promise.all(composition.scenes.map(async (scene) => {
      const probe = async (url?: string, kind: 'audio' | 'video' = 'audio') => {
        if (!url) return undefined;
        return new Promise<number | undefined>((resolve) => {
          const media = document.createElement(kind);
          media.preload = 'metadata';
          media.onloadedmetadata = () => resolve(Number.isFinite(media.duration) ? media.duration : undefined);
          media.onerror = () => resolve(undefined);
          media.src = url;
        });
      };
      const [audioDuration, videoDuration] = await Promise.all([
        probe(scene.narration.sourceUrl, 'audio'),
        probe(scene.videoUrl, 'video'),
      ]);
      return { sceneId: scene.sceneId, audioDuration, videoDuration };
    })).then((results) => {
      if (cancelled) return;
      let changed = false;
      const scenes = composition.scenes.map((scene) => {
        const result = results.find((item) => item.sceneId === scene.sceneId);
        if (!result) return scene;
        const audioDuration = result.audioDuration ?? scene.narration.sourceDurationSec;
        const videoDuration = result.videoDuration ?? scene.sourceDurationSec;
        const requiredDuration = audioDuration
          ? scene.narration.startOffsetSec + Math.max(0, audioDuration - scene.narration.trimStartSec - scene.narration.trimEndSec)
          : scene.durationSec;
        const durationSec = Math.max(scene.durationSec, requiredDuration);
        if (audioDuration !== scene.narration.sourceDurationSec || videoDuration !== scene.sourceDurationSec || durationSec !== scene.durationSec) changed = true;
        const subtitleEndOffsetSec = Math.min(durationSec, requiredDuration);
        const subtitles = subtitleClips(scene).map((subtitle) => ({
          ...subtitle,
          endOffsetSec: Math.min(durationSec, Math.max(subtitle.startOffsetSec, subtitle.endOffsetSec)),
        }));
        return {
          ...scene,
          durationSec,
          sourceDurationSec: videoDuration,
          narration: { ...scene.narration, sourceDurationSec: audioDuration },
          subtitle: { ...scene.subtitle, endOffsetSec: Math.max(scene.subtitle.endOffsetSec, subtitleEndOffsetSec) },
          subtitles,
        };
      });
      if (changed) commitComposition({ ...composition, scenes }, false);
    });
    return () => { cancelled = true; };
  }, [composition?.version, composition?.scenes.map((scene) => `${scene.sceneId}:${scene.videoUrl}:${scene.narration.sourceUrl}`).join('|')]);

  const syncMedia = () => {
    if (!active) return;
    const { scene, localTime } = { scene: active.scene, localTime: data.currentTime - active.startSec };
    const video = videoRef.current;
    const narration = narrationRef.current;
    const music = musicRef.current;

    if (video) {
      if (scene.mediaType === 'video' && scene.videoUrl) {
        if (video.src !== new URL(scene.videoUrl, window.location.href).href) video.src = scene.videoUrl;
        const playable = Math.max(0.1, (scene.sourceDurationSec || scene.durationSec) - scene.trimStartSec - scene.trimEndSec);
        const target = scene.trimStartSec + (localTime % playable);
        if (Number.isFinite(video.duration) && Math.abs(video.currentTime - target) > 0.35) video.currentTime = Math.min(target, Math.max(0, video.duration - 0.05));
        video.playbackRate = data.playbackSpeed;
        if (data.isPlaying) void video.play().catch(() => undefined); else video.pause();
      } else {
        video.pause();
        video.removeAttribute('src');
      }
    }

    if (narration) {
      const audioStart = scene.narration.startOffsetSec;
      const audioDuration = narrationDuration(scene);
      const inAudio = localTime >= audioStart && localTime < audioStart + audioDuration;
      if (scene.narration.sourceUrl) {
        if (narration.src !== new URL(scene.narration.sourceUrl, window.location.href).href) narration.src = scene.narration.sourceUrl;
        const target = scene.narration.trimStartSec + Math.max(0, localTime - audioStart);
        if (Math.abs(narration.currentTime - target) > 0.35) narration.currentTime = target;
        narration.playbackRate = data.playbackSpeed;
        narration.volume = data.volume;
        if (data.isPlaying && inAudio) void narration.play().catch(() => undefined); else narration.pause();
      } else {
        narration.pause();
      }
    }

    if (music && composition?.backgroundAudio) {
      if (music.src !== new URL(composition.backgroundAudio.sourceUrl, window.location.href).href) music.src = composition.backgroundAudio.sourceUrl;
      if (Math.abs(music.currentTime - data.currentTime) > 0.5) music.currentTime = data.currentTime;
      music.volume = composition.backgroundAudio.volume;
      music.playbackRate = data.playbackSpeed;
      if (data.isPlaying) void music.play().catch(() => undefined); else music.pause();
    }

    if (lastSceneRef.current !== scene.sceneId) lastSceneRef.current = scene.sceneId;
  };

  useEffect(syncMedia, [data.currentTime, data.isPlaying, data.playbackSpeed, data.volume, active?.scene.sceneId, composition?.backgroundAudio]);

  useEffect(() => {
    currentTimeRef.current = data.currentTime;
  }, [data.currentTime]);

  useEffect(() => {
    if (!data.isPlaying || !composition) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const next = currentTimeRef.current + ((now - previous) / 1000) * data.playbackSpeed;
      previous = now;
      if (next >= totalDurationSec) {
        currentTimeRef.current = totalDurationSec;
        updateData({ currentTime: totalDurationSec, isPlaying: false });
      } else {
        currentTimeRef.current = next;
        updateData({ currentTime: next });
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [data.isPlaying, data.playbackSpeed, totalDurationSec, composition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composition) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const item = findSceneAtTime(composition, currentTimeRef.current);
      const scene = item?.scene;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (scene) {
        const video = videoRef.current;
        const image = imageRef.current;
        const fallbackUrl = scene.imageUrl || generateSceneSvgDataUrl(scene.title, stage1Data.visualStyle, scene.sceneNumber, scene.title, composition.aspectRatio);
        if (image && image.src !== new URL(fallbackUrl, window.location.href).href) image.src = fallbackUrl;
        const source = scene.mediaType === 'video' && video?.readyState && video.videoWidth ? video : image;
        if (source && ('videoWidth' in source ? source.videoWidth : source.naturalWidth)) {
          const sourceWidth = 'videoWidth' in source ? source.videoWidth : source.naturalWidth;
          const sourceHeight = 'videoHeight' in source ? source.videoHeight : source.naturalHeight;
          const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
          const width = sourceWidth * scale;
          const height = sourceHeight * scale;
          ctx.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        }
        const localTime = currentTimeRef.current - item.startSec;
        const subtitle = subtitleClips(scene).find((item) => localTime >= item.startOffsetSec && localTime <= item.endOffsetSec);
        if (subtitle?.text && localTime >= subtitle.startOffsetSec && localTime <= subtitle.endOffsetSec) {
          const y = canvas.height - 92;
          ctx.fillStyle = data.captionStyle === 'Bold Pop-up' ? 'rgba(15,23,42,.92)' : 'rgba(0,0,0,.76)';
          ctx.fillRect(canvas.width * .08, y, canvas.width * .84, 62);
          ctx.font = `bold ${composition.aspectRatio === '9:16' ? 25 : 20}px system-ui`;
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(subtitle.text.slice(0, 110) + (subtitle.text.length > 110 ? '…' : ''), canvas.width / 2, y + 39, canvas.width * .78);
        }
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    animationRef.current = requestAnimationFrame(draw);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [composition, data.captionStyle, stage1Data.visualStyle]);

  const generateSceneVideo = async (sceneId: string) => {
    const scene = stage3Data.scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    if (!videoModel) {
      setExportError('Choose a video model before starting synthesis.');
      return;
    }
    const prompt = scene.videoPrompt || `Animate the scene with a gentle ${scene.cameraAngle} camera movement.`;
    const current: SceneVideoAsset = { sceneId, prompt, isGenerating: true, videoUrl: data.sceneVideos?.[sceneId]?.videoUrl, modelUsed: videoModel };
    updateData({ sceneVideos: { ...(data.sceneVideos || {}), [sceneId]: current } });
    try {
      const sample = await loadDemoSampleOutput<Pick<Stage6Data, 'sceneVideos'>>(stage1Data.presetId, 'stage6', videoModel);
      if (!sample) throw new Error('This model does not have a saved video-generation sample yet.');
      const savedAsset = sample.output.sceneVideos?.[sceneId];
      if (!savedAsset) throw new Error('No saved video is available for this scene.');
      const saved = { ...current, ...savedAsset, isGenerating: false, error: undefined };
      updateData({ sceneVideos: { ...(data.sceneVideos || {}), [sceneId]: saved } });
      if (composition) updateScene(sceneId, (clip) => ({ ...clip, mediaType: 'video', videoUrl: saved.videoUrl }));
    } catch (error: any) {
      updateData({ sceneVideos: { ...(data.sceneVideos || {}), [sceneId]: { ...current, isGenerating: false, error: error.message } } });
      setExportError(error.message || 'Unable to synthesize the video clip.');
    }
  };

  const generateAllSceneVideos = async () => {
    if (isGeneratingVideos) return;
    if (!videoModel) {
      setExportError('Choose a video model before starting synthesis.');
      return;
    }
    if (!stage3Data.scenes.length) {
      setExportError('Generate the production script before creating video clips.');
      return;
    }
    setIsGeneratingVideos(true);
    setExportError(null);
    try {
      const sample = await loadDemoSampleOutput<Partial<Stage6Data>>(stage1Data.presetId, 'stage6', videoModel);
      if (!sample) throw new Error('This model does not have a saved video-generation sample yet.');
      const sceneVideos = sample.output.sceneVideos || {};
      updateData({
        sceneVideos,
        composition: sample.output.composition || buildInitialComposition(stage3Data, stage4Data, stage5Data, sceneVideos),
      });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to synthesize the video clips.');
    } finally {
      setIsGeneratingVideos(false);
    }
  };

  const captureAudioTracks = (stream: MediaStream, media: HTMLMediaElement | null) => {
    if (!media) return;
    const captured = (media as any).captureStream?.() || (media as any).mozCaptureStream?.();
    captured?.getAudioTracks?.().forEach((track: MediaStreamTrack) => stream.addTrack(track));
  };

  const handleExportVideoFile = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !composition) return;
    setExportError(null);
    updateData({ isExporting: true, exportProgress: 0, exportedVideoUrl: undefined, currentTime: 0, isPlaying: true, playbackSpeed: 1 });
    currentTimeRef.current = 0;
    try {
      const stream = canvas.captureStream(30);
      captureAudioTracks(stream, narrationRef.current);
      captureAudioTracks(stream, musicRef.current);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        updateData({ exportProgress: 99, isPlaying: false, currentTime: 0 });
        try {
          const webm = new Blob(chunks, { type: 'video/webm' });
          const response = await fetch('/api/stage6/convert-to-mp4', {
            method: 'POST',
            headers: { 'Content-Type': 'video/webm' },
            body: webm,
          });
          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || 'MP4 conversion failed.');
          }
          const mp4 = await response.blob();
          const url = URL.createObjectURL(mp4);
          updateData({ isExporting: false, exportProgress: 100, exportedVideoUrl: url, isPlaying: false, currentTime: 0 });
        } catch (error) {
          setExportError(error instanceof Error ? error.message : 'MP4 conversion failed.');
          updateData({ isExporting: false, isPlaying: false, currentTime: 0 });
        }
      };
      recorder.start(1000);
      const started = performance.now();
      const progressTimer = window.setInterval(() => {
        const elapsed = (performance.now() - started) / 1000;
        updateData({ exportProgress: Math.min(99, Math.round((elapsed / totalDurationSec) * 100)) });
        if (elapsed >= totalDurationSec) {
          window.clearInterval(progressTimer);
          recorder.stop();
        }
      }, 250);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
      updateData({ isExporting: false, isPlaying: false });
    }
  };

  const formatTimecode = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
  const blockStyle = (startSec: number, durationSec: number) => ({ left: startSec * PIXELS_PER_SECOND, width: Math.max(42, durationSec * PIXELS_PER_SECOND) });
  const subtitleClips = (scene: TimelineSceneClip): TimelineSubtitleClip[] => scene.subtitles?.length ? scene.subtitles : [scene.subtitle];

  if (!composition) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
        <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3"><Film className="w-3.5 h-3.5" />Stage 06: Final Video Studio & Exporter</div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Timeline Video Editor</h1>
              <p className="text-sm text-slate-400 max-w-2xl mt-1">Choose a model, then synthesize the saved video clips to open the editable timeline.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={onPrevStage} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800"><ArrowLeft className="w-4 h-4" />Back to Stage 05</button>
              <button onClick={() => setIsModelModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#0F1116] hover:bg-slate-800 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400"><Video className="w-4 h-4" />{videoModel || 'Select model'}</button>
            </div>
          </div>
        </div>
        <div className="bg-[#14161C] border border-slate-800 rounded-xl p-6 text-center space-y-4">
          <button onClick={generateAllSceneVideos} disabled={isGeneratingVideos || !videoModel || !stage3Data.scenes.length} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">
            <Sparkles className={`inline w-4 h-4 mr-2 ${isGeneratingVideos ? 'animate-spin' : ''}`} />{isGeneratingVideos ? 'Preparing saved video clips...' : 'Synthesis with AI'}
          </button>
          {exportError && <p className="text-xs text-rose-300">{exportError}</p>}
        </div>
        <ModelSelectorModal category="video" selectedModel={videoModel} onSelectModel={(model) => { setExportError(null); setVideoModel(model); updateData({ sceneVideos: {}, composition: undefined }); }} stageName="Stage 06 (Video Generator)" isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-7 animate-fadeIn">
      <video ref={videoRef} className="hidden" muted playsInline preload="auto" />
      <img ref={imageRef} className="hidden" alt="Scene fallback" />
      <audio ref={narrationRef} preload="auto" />
      <audio ref={musicRef} preload="auto" loop />

      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3"><Film className="w-3.5 h-3.5" />Stage 06: Final Video Studio & Exporter</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Timeline Video Editor</h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">Generated clips, narration and editable subtitles are assembled automatically. Fine-tune the timeline, then export exactly what you preview.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={onPrevStage} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800"><ArrowLeft className="w-4 h-4" />Back to Stage 05</button>
            <button onClick={handleExportVideoFile} disabled={data.isExporting || !composition.scenes.length} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-lg">
              {data.isExporting ? <><Sparkles className="w-4 h-4 animate-spin" />Rendering {data.exportProgress}%</> : <><Download className="w-4 h-4" />Export Edited Video</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#14161C] border border-slate-800 rounded-xl p-4 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs"><Monitor className="w-4 h-4 text-blue-400" /><span className="font-bold text-slate-300">Viewport</span>{(['16:9','9:16'] as const).map((ratio) => <button key={ratio} onClick={() => commitComposition({ ...composition, aspectRatio: ratio })} className={`px-3 py-1.5 rounded-lg border ${composition.aspectRatio === ratio ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-slate-400'}`}>{ratio} {ratio === '16:9' ? 'Widescreen' : 'Shorts'}</button>)}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400">Speed {[1,1.25,1.5].map((speed) => <button key={speed} onClick={() => updateData({ playbackSpeed: speed })} className={`px-2 py-1 rounded ${data.playbackSpeed === speed ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}`}>{speed}x</button>)}</div>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
            <canvas ref={canvasRef} width={composition.aspectRatio === '16:9' ? 1280 : 720} height={composition.aspectRatio === '16:9' ? 720 : 1280} className="w-full h-auto max-h-[55vh] object-contain" />
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 rounded text-[10px] text-white flex items-center gap-1.5">{active?.scene.mediaType === 'video' ? <Video className="w-3 h-3 text-emerald-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}{active?.scene.mediaType === 'video' ? 'Generated clip' : 'Image fallback'}</div>
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#14161C]/85 border border-slate-700 rounded text-[10px] font-bold text-blue-400"><Sparkles className="inline w-3 h-3 mr-1" />REANIMATE Studio</div>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label={data.isPlaying ? 'Pause composition' : 'Play composition'} title={data.isPlaying ? 'Pause composition' : 'Play composition'} onClick={() => updateData({ isPlaying: !data.isPlaying })} className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center">{data.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}</button>
            <button aria-label="Restart composition" title="Restart composition" onClick={() => { currentTimeRef.current = 0; updateData({ currentTime: 0, isPlaying: false }); }} className="p-3 bg-[#0F1116] border border-slate-800 rounded-lg text-slate-300"><RotateCcw className="w-4 h-4" /></button>
            <div className="flex-1"><input type="range" min={0} max={Math.max(.1,totalDurationSec)} step=".05" value={Math.min(data.currentTime,totalDurationSec)} onChange={(event) => { const value=Number(event.target.value); currentTimeRef.current=value; updateData({ currentTime:value }); }} className="w-full accent-blue-500" /><div className="flex justify-between text-[11px] font-mono text-slate-400"><span>{formatTimecode(data.currentTime)}</span><span>{formatTimecode(totalDurationSec)}</span></div></div>
          </div>
          {exportError && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{exportError}</p>}
        </div>

        <div className="lg:col-span-4 space-y-4">
          {data.exportedVideoUrl && <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4"><div className="text-emerald-400 font-bold text-xs mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />MP4 video ready</div><a href={data.exportedVideoUrl} download="REANIMATE_Edited_Video.mp4" type="video/mp4" className="block text-center py-2.5 bg-emerald-600 rounded-lg text-xs font-semibold text-white">Download MP4</a></div>}
          <div className="bg-[#14161C] border border-emerald-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5"><Video className="w-4 h-4 text-emerald-400" />Generated asset library</h3><button onClick={() => setIsModelModalOpen(true)} className="text-[10px] text-emerald-400">{videoModel || 'Select model'}</button></div>
            <button onClick={generateAllSceneVideos} disabled={isGeneratingVideos || !videoModel} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"><Sparkles className={`inline w-4 h-4 mr-2 ${isGeneratingVideos ? 'animate-spin' : ''}`} />{isGeneratingVideos ? 'Preparing saved video clips...' : 'Synthesis with AI'}</button>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {composition.scenes.map((scene) => <button key={scene.sceneId} onClick={() => { setSelectedSceneId(scene.sceneId); const item=offsets.find((offset)=>offset.scene.sceneId===scene.sceneId); if(item) updateData({currentTime:item.startSec}); }} className={`w-full p-2 rounded-lg border text-left ${selectedScene?.sceneId === scene.sceneId ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-black/30'}`}><div className="flex gap-2"><div className="w-20 aspect-video rounded overflow-hidden bg-black">{scene.videoUrl ? <video src={scene.videoUrl} muted preload="metadata" className="w-full h-full object-cover" /> : scene.imageUrl ? <img src={scene.imageUrl} className="w-full h-full object-cover" /> : null}</div><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{scene.sceneNumber}. {scene.title}</div><div className={`text-[10px] mt-1 ${scene.mediaType === 'video' ? 'text-emerald-400' : 'text-amber-400'}`}>{scene.mediaType === 'video' ? 'Video clip' : 'Image fallback'} · {scene.durationSec.toFixed(1)}s</div></div></div></button>)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#14161C] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-white flex items-center gap-2"><Layers className="w-4 h-4 text-blue-400" />Composition timeline</h2><p className="text-[11px] text-slate-500 mt-1">Drag scenes to reorder. Drag narration blocks to reposition them inside their linked scene.</p></div><div className="flex gap-2"><button onClick={undoTimeline} disabled={!history.length} className="px-3 py-2 text-xs border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40"><Undo2 className="inline w-3.5 h-3.5 mr-1" />Undo</button><button onClick={resetTimeline} className="px-3 py-2 text-xs border border-slate-700 rounded-lg text-slate-300"><RefreshCw className="inline w-3.5 h-3.5 mr-1" />Reset timeline</button></div></div>
        <div className="overflow-x-auto pb-2">
          <div className="relative" style={{ width: timelineWidth }}>
            <div className="h-7 border-b border-slate-800 text-[9px] text-slate-500 relative">{Array.from({length:Math.ceil(totalDurationSec/5)+1},(_,i)=><span key={i} className="absolute" style={{left:i*5*PIXELS_PER_SECOND}}>{i*5}s</span>)}</div>
            {[
              {label:'Scenes', icon:<Video className="w-3.5 h-3.5" />, color:'blue'},
              {label:'Narration', icon:<Mic className="w-3.5 h-3.5" />, color:'emerald'},
              {label:'Subtitles', icon:<Subtitles className="w-3.5 h-3.5" />, color:'violet'},
              {label:'Music / SFX', icon:<Music className="w-3.5 h-3.5" />, color:'amber'},
            ].map((track,trackIndex)=><div key={track.label} className="relative h-16 border-b border-slate-800/80 bg-[#0F1116]/60" onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{
              if(trackIndex===0 && dragSceneRef.current){ const target=(event.target as HTMLElement).closest('[data-scene-id]')?.getAttribute('data-scene-id'); if(target) commitComposition(reorderScenes(composition,dragSceneRef.current,target)); dragSceneRef.current=null; }
              if(trackIndex===1 && dragAudioRef.current){ const rect=event.currentTarget.getBoundingClientRect(); const global=clampTime((event.clientX-rect.left)/PIXELS_PER_SECOND,0,totalDurationSec); const item=offsets.find((offset)=>offset.scene.sceneId===dragAudioRef.current); if(item){ const offset=clampTime(global-item.startSec,0,item.scene.durationSec); updateScene(item.scene.sceneId,(scene)=>({...scene,narration:{...scene.narration,startOffsetSec:offset}})); } dragAudioRef.current=null; }
            }}>
              <div className="sticky left-0 z-20 w-28 h-full bg-[#14161C] border-r border-slate-800 px-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">{track.icon}{track.label}</div>
              {trackIndex===0 && offsets.map(({scene,startSec})=><div data-scene-id={scene.id} key={scene.id} draggable onDragStart={()=>dragSceneRef.current=scene.id} onClick={()=>setSelectedSceneId(scene.sceneId)} style={blockStyle(startSec,scene.durationSec)} className={`absolute top-2 h-12 rounded-lg border cursor-grab px-2 py-1 overflow-hidden ${selectedScene?.sceneId===scene.sceneId?'bg-blue-600/30 border-blue-400':'bg-blue-950/70 border-blue-700'}`}><GripVertical className="inline w-3 h-3 text-blue-300 mr-1" /><span className="text-[10px] font-bold text-white">{scene.sceneNumber}. {scene.title}</span><div className="text-[9px] text-blue-200">{scene.mediaType} · {scene.durationSec.toFixed(1)}s</div></div>)}
              {trackIndex===1 && offsets.map(({scene,startSec})=>{const overlap=narrationOverlaps(scene);return <div key={scene.narration.id} draggable onDragStart={()=>dragAudioRef.current=scene.sceneId} onClick={()=>setSelectedSceneId(scene.sceneId)} style={blockStyle(startSec+scene.narration.startOffsetSec,narrationDuration(scene))} className={`absolute top-2 h-12 rounded-lg border cursor-ew-resize px-2 py-1 overflow-hidden ${overlap?'bg-rose-950/80 border-rose-500':'bg-emerald-950/80 border-emerald-600'}`}><Link2 className="inline w-3 h-3 mr-1" /><span className="text-[10px] font-bold text-white">Voice {scene.sceneNumber}</span><div className="text-[9px] text-emerald-200">{scene.narration.sourceUrl?'linked audio':'no audio asset'}{overlap?' · OVERLAP':''}</div></div>})}
              {trackIndex===2 && offsets.flatMap(({scene,startSec})=>subtitleClips(scene).map((subtitle,index)=><div key={subtitle.id} onClick={()=>setSelectedSceneId(scene.sceneId)} style={blockStyle(startSec+subtitle.startOffsetSec,subtitle.endOffsetSec-subtitle.startOffsetSec)} className="absolute top-2 h-12 rounded-lg border bg-violet-950/80 border-violet-600 px-2 py-1 overflow-hidden cursor-pointer"><span className="text-[10px] font-bold text-white">CC {scene.sceneNumber}.{index+1}</span><div className="text-[9px] text-violet-200 truncate">{subtitle.text}</div></div>))}
              {trackIndex===3 && composition.backgroundAudio && <div style={blockStyle(0,totalDurationSec)} className="absolute top-2 h-12 rounded-lg border bg-amber-950/70 border-amber-600 px-2 py-1"><span className="text-[10px] font-bold text-white">{composition.backgroundAudio.title}</span><div className="text-[9px] text-amber-200">Full composition · {Math.round(composition.backgroundAudio.volume*100)}%</div></div>}
            </div>)}
            <div className="absolute top-0 bottom-0 w-px bg-rose-400 z-30 pointer-events-none" style={{left:data.currentTime*PIXELS_PER_SECOND}}><div className="w-2 h-2 bg-rose-400 rotate-45 -translate-x-[3px]" /></div>
          </div>
        </div>
      </div>

      {selectedScene && <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 bg-[#14161C] border border-slate-800 rounded-xl p-5">
        <div className="space-y-3"><h3 className="text-xs font-bold text-white flex items-center gap-2"><Scissors className="w-4 h-4 text-blue-400" />Scene {selectedScene.sceneNumber} properties</h3><label className="text-[11px] text-slate-400 block">Scene duration (seconds)<input type="number" min=".5" step=".1" value={selectedScene.durationSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,durationSec:Math.max(.5,Number(event.target.value)),subtitle:{...scene.subtitle,endOffsetSec:Math.min(scene.subtitle.endOffsetSec,Math.max(.5,Number(event.target.value)))}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-400">Video trim start<input type="number" min="0" step=".1" value={selectedScene.trimStartSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,trimStartSec:Math.max(0,Number(event.target.value))}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label><label className="text-[11px] text-slate-400">Video trim end<input type="number" min="0" step=".1" value={selectedScene.trimEndSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,trimEndSec:Math.max(0,Number(event.target.value))}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label></div></div>
        <div className="space-y-3"><h3 className="text-xs font-bold text-white flex items-center gap-2"><Mic className="w-4 h-4 text-emerald-400" />Narration timing</h3><label className="text-[11px] text-slate-400 block">Start inside scene<input type="number" min="0" step=".1" value={selectedScene.narration.startOffsetSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,narration:{...scene.narration,startOffsetSec:Math.max(0,Number(event.target.value))}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-400">Audio trim start<input type="number" min="0" step=".1" value={selectedScene.narration.trimStartSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,narration:{...scene.narration,trimStartSec:Math.max(0,Number(event.target.value))}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label><label className="text-[11px] text-slate-400">Audio trim end<input type="number" min="0" step=".1" value={selectedScene.narration.trimEndSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,narration:{...scene.narration,trimEndSec:Math.max(0,Number(event.target.value))}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label></div>{narrationOverlaps(selectedScene)&&<p className="text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded p-2"><AlertTriangle className="inline w-3 h-3 mr-1" />Narration extends into the next scene. Increase scene duration or trim/reposition audio.</p>}</div>
        <div className="space-y-3"><h3 className="text-xs font-bold text-white flex items-center gap-2"><Subtitles className="w-4 h-4 text-violet-400" />Subtitle</h3><textarea value={selectedScene.subtitle.text} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,subtitle:{...scene.subtitle,text:event.target.value}}))} rows={3} className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-white" /><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-400">Start<input type="number" min="0" step=".1" value={selectedScene.subtitle.startOffsetSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,subtitle:{...scene.subtitle,startOffsetSec:clampTime(Number(event.target.value),0,scene.subtitle.endOffsetSec)}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label><label className="text-[11px] text-slate-400">End<input type="number" min="0" step=".1" value={selectedScene.subtitle.endOffsetSec} onChange={(event)=>updateScene(selectedScene.sceneId,(scene)=>({...scene,subtitle:{...scene.subtitle,endOffsetSec:clampTime(Number(event.target.value),scene.subtitle.startOffsetSec,scene.durationSec)}}))} className="mt-1 w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-white" /></label></div></div>
      </div>}

      <ModelSelectorModal category="video" selectedModel={videoModel} onSelectModel={(model) => { setExportError(null); setVideoModel(model); updateData({ sceneVideos: {}, composition: undefined }); }} stageName="Stage 06 (Video Generator)" isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)} />
    </div>
  );
};
