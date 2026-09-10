import React, { useState } from 'react';
import { Stage3Data, Stage4Data, VoiceoverAsset } from '../types';
import { speakText, stopSpeech, startBackgroundMusic, stopBackgroundMusic } from '../utils/audioSynth';
import { ModelSelectorModal } from './ModelSelectorModal';
import { saveStageInputOutput } from '../utils/runStorage';
import { buildElevenLabsRequestPreview, buildGeminiNarrationPrompt } from '../utils/ttsPrompt';
import { loadDemoSampleOutput } from '../data/demoRun';
import { 
  Mic, 
  Play, 
  Square, 
  Volume2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Cpu, 
  Wand2, 
  Music, 
  CheckCircle2, 
  Radio,
  X
} from 'lucide-react';

interface Stage4AssetsVoiceoverProps {
  stage3Data: Stage3Data;
  data: Stage4Data;
  presetId?: string;
  updateData: (fields: Partial<Stage4Data>) => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  runId?: string | null;
}

const VOICE_PROFILES = [
  { id: 'Kore', name: 'Kore (Clear & Professional Female)' },
  { id: 'Puck', name: 'Puck (Engaging & Enthusiastic Male)' },
  { id: 'Zephyr', name: 'Zephyr (Warm & Educational Male)' },
  { id: 'Fenrir', name: 'Fenrir (Deep & Authoritative Male)' },
  { id: 'Charon', name: 'Charon (Calm & Precise Female)' },
];

export const Stage4AssetsVoiceover: React.FC<Stage4AssetsVoiceoverProps> = ({
  stage3Data,
  data,
  updateData,
  presetId,
  onPrevStage,
  onNextStage,
  runId,
}) => {
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [isMusicPlayingLocally, setIsMusicPlayingLocally] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

  const showDemoNotice = () => setIsDemoNoticeOpen(true);

  const handleSynthesizeSceneVoiceover = async (sceneId: string, dialogueText: string) => {
    if (!data.selectedModel) {
      setTtsError('Choose a TTS model before starting synthesis.');
      return;
    }
    setTtsError(null);
    const currentAsset = data.voiceoverAssets[sceneId] || {
      sceneId,
      voiceName: data.selectedVoice || 'Kore',
      speed: 1.0,
      pitch: 1.0,
      isGenerating: true,
    };

    updateData({
      voiceoverAssets: {
        ...data.voiceoverAssets,
        [sceneId]: { ...currentAsset, isGenerating: true },
      },
    });

    try {
      const input = { text: dialogueText, voiceName: currentAsset.voiceName, selectedModel: data.selectedModel };
      const sample = await loadDemoSampleOutput<Stage4Data>(presetId, 'stage4', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved voiceover sample yet.');
      const savedAsset = sample.output.voiceoverAssets[sceneId];
      if (!savedAsset) throw new Error('No saved voiceover is available for this scene.');
      const voiceoverAssets = { ...data.voiceoverAssets, [sceneId]: { ...currentAsset, ...savedAsset, isGenerating: false } };
      updateData({ voiceoverAssets });
      await saveStageInputOutput(runId || null, 4, input, savedAsset, { ...data, voiceoverAssets });
    } catch (err) {
      console.error('Failed to generate TTS audio:', err);
      setTtsError(err instanceof Error ? err.message : 'Unable to synthesize the voiceover.');
      updateData({
        voiceoverAssets: {
          ...data.voiceoverAssets,
          [sceneId]: { ...currentAsset, isGenerating: false },
        },
      });
    }
  };

  const handleGenerateAllVoiceovers = async () => {
    if (isBatchGenerating) return;
    if (!data.selectedModel) {
      setTtsError('Choose a TTS model before starting synthesis.');
      return;
    }
    setIsBatchGenerating(true);
    setTtsError(null);
    try {
      const sample = await loadDemoSampleOutput<Stage4Data>(presetId, 'stage4', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved voiceover sample yet.');
      updateData(sample.output);
      await saveStageInputOutput(runId || null, 4, { selectedModel: data.selectedModel }, sample.output, sample.output);
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : 'Unable to synthesize the voiceovers.');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handlePlaySceneSpeech = (sceneId: string, text: string) => {
    if (playingSceneId === sceneId) {
      stopSpeech();
      setPlayingSceneId(null);
      return;
    }

    const asset = data.voiceoverAssets[sceneId];
    setPlayingSceneId(sceneId);

    if (asset?.audioDataUrl) {
      const audio = new Audio(asset.audioDataUrl);
      audio.onended = () => setPlayingSceneId(null);
      audio.onerror = () => setPlayingSceneId(null);
      audio.play();
    } else {
      speakText(
        text,
        asset?.voiceName || data.selectedVoice,
        asset?.speed || 1.0,
        asset?.pitch || 1.0,
        () => setPlayingSceneId(null)
      );
    }
  };

  const toggleBackgroundMusicPreview = () => {
    if (isMusicPlayingLocally) {
      stopBackgroundMusic();
      setIsMusicPlayingLocally(false);
    } else {
      startBackgroundMusic(stage3Data.globalMusicGenre || 'Lo-Fi', data.bgMusicVolume);
      setIsMusicPlayingLocally(true);
    }
  };

  const handleVolumeChange = (_vol: number) => showDemoNotice();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Stage Banner */}
      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Mic className="w-3.5 h-3.5" />
              <span>Stage 04: Voiceover Synthesis & Audio Mixer</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Voiceover Studio & Soundscape Mixer
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Synthesize neural voiceovers for every scene narration, choose speaker voices, adjust pitch/cadence, and layer dynamic background music loops.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onPrevStage}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stage 03</span>
            </button>

            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#0F1116] hover:bg-slate-800 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400 hover:text-white transition shadow-lg"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>TTS Model: <strong className="text-white ml-1">{data.selectedModel || 'Select model'}</strong></span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Audio Controls */}
      {ttsError && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl px-4 py-3 text-xs text-rose-200">
          <strong className="text-rose-300">TTS configuration:</strong> {ttsError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Voice & Speaker Settings (7 Cols) */}
        <div className="md:col-span-7 bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Mic className="w-4 h-4 text-blue-400" />
              <span>Speaker Voice Profile</span>
            </h3>

            <button
              onClick={handleGenerateAllVoiceovers}
              disabled={isBatchGenerating || !data.selectedModel || stage3Data.scenes.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-blue-900/20 transition flex items-center space-x-1.5"
            >
              {isBatchGenerating ? (
                <>
                  <Wand2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing All...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Batch Synthesize Voiceovers</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VOICE_PROFILES.map((voice) => (
              <button
                key={voice.id}
                onClick={showDemoNotice}
                className={`p-3 rounded-lg border text-left text-xs font-semibold transition flex items-center justify-between ${
                  data.selectedVoice === voice.id
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-md'
                    : 'bg-[#0F1116] border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <span>{voice.name}</span>
                {data.selectedVoice === voice.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Background Music Mixer (5 Cols) */}
        <div className="md:col-span-5 bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Music className="w-4 h-4 text-indigo-400" />
              <span>Background Soundscape Mixer</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Genre: <strong className="text-blue-400 ml-1">{stage3Data.globalMusicGenre}</strong></span>
              <button
                onClick={toggleBackgroundMusicPreview}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                  isMusicPlayingLocally
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isMusicPlayingLocally ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isMusicPlayingLocally ? 'Stop Soundscape' : 'Test Soundscape'}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Music Volume:</span>
                <span className="font-mono text-blue-400 font-bold">{Math.round(data.bgMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={data.bgMusicVolume}
                onFocus={showDemoNotice}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-[#0F1116] rounded-lg cursor-pointer h-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scene Voiceover Studio Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Radio className="w-4 h-4 text-blue-400" />
            <span>Scene Voiceover Narration Studio ({stage3Data.scenes.length})</span>
          </h3>

          <button
            onClick={onNextStage}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-900/20 transition"
          >
            <span>Next Step: Scene Visual Keyframes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {stage3Data.scenes.map((scene) => {
            const asset = data.voiceoverAssets[scene.id] || {
              sceneId: scene.id,
              voiceName: data.selectedVoice,
              speed: 1.0,
              pitch: 1.0,
            };
            const isPlayingThis = playingSceneId === scene.id;

            return (
              <div
                key={scene.id}
                className="bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      #{scene.sceneNumber.toString().padStart(2, '0')}
                    </span>
                    <span className="font-bold text-white text-xs">{scene.sceneTitle}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {asset.audioDataUrl && (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>AI Audio Ready</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleSynthesizeSceneVoiceover(scene.id, scene.dialogueNarrative)}
                      disabled={asset.isGenerating}
                      className="px-3 py-1.5 bg-[#0F1116] hover:bg-slate-800 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/30 transition flex items-center space-x-1.5"
                    >
                      {asset.isGenerating ? (
                        <Wand2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{asset.audioDataUrl ? 'Re-Synthesize' : 'Synthesize AI Audio'}</span>
                    </button>

                    <button
                      onClick={() => handlePlaySceneSpeech(scene.id, scene.dialogueNarrative)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium shadow-md transition flex items-center space-x-1.5 ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingThis ? 'Stop Audio' : 'Preview Narration'}</span>
                    </button>
                  </div>
                </div>

                {/* Spoken Text Box */}
                <div className="bg-[#0F1116] p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Narration Script:</span>
                  <p className="text-xs text-blue-200 leading-relaxed font-medium">"{scene.dialogueNarrative}"</p>
                </div>

                <details className="bg-[#0F1116] rounded-lg border border-slate-800">
                  <summary className="cursor-pointer px-3.5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    View TTS Request
                  </summary>
                  <pre className="px-3.5 pb-3.5 text-[10px] text-emerald-300 whitespace-pre-wrap break-words leading-relaxed">
                    {data.selectedModel === 'elevenlabs-tts'
                      ? buildElevenLabsRequestPreview(scene.dialogueNarrative)
                      : buildGeminiNarrationPrompt(scene.dialogueNarrative)}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        category="audio"
        selectedModel={data.selectedModel}
        onSelectModel={(m) => { setTtsError(null); updateData({ selectedModel: m, voiceoverAssets: {} }); }}
        stageName="Stage 4 (TTS Neural Voiceover Engine)"
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {isDemoNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="demo-notice-title" onMouseDown={() => setIsDemoNoticeOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-blue-500/30 bg-[#14161C] p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Demo version</p>
                <h2 id="demo-notice-title" className="mt-1 text-lg font-bold text-white">Input is unavailable</h2>
              </div>
              <button type="button" onClick={() => setIsDemoNoticeOpen(false)} aria-label="Close demo notice" className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">This is a demo version. Changing voice and soundscape settings in Stage 4 is not available for input.</p>
            <button type="button" onClick={() => setIsDemoNoticeOpen(false)} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
};
