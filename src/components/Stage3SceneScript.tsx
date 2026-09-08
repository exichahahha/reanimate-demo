import React, { useState } from 'react';
import { Stage2Data, Stage3Data, SceneScriptItem } from '../types';
import { ModelSelectorModal } from './ModelSelectorModal';
import { loadDemoSampleOutput } from '../data/demoRun';
import { saveStageInputOutput } from '../utils/runStorage';
import { 
  Clapperboard, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Cpu, 
  Wand2, 
  Video, 
  Music, 
  Camera, 
  Copy,
  Layers,
  Sparkle,
  Image as ImageIcon,
  Film,
  Link,
  Check,
  X
} from 'lucide-react';

interface Stage3SceneScriptProps {
  stage2Data: Stage2Data;
  data: Stage3Data;
  updateData: (fields: Partial<Stage3Data>) => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  runId?: string | null;
}

const CAMERA_ANGLES = [
  'Wide Shot (Pan)',
  'Medium Push-in',
  'Close-up Focus',
  'Top-down Overhead',
  'Dynamic 360 Rotation',
  'Dutch Angle Tilt',
  'Split Screen Comparison',
];

const MOTION_GRAPHICS = [
  'Diagram Reveal',
  'Animated Text Callout',
  'Flowchart Connector',
  'Graph Plotting',
  '3D Object Spin',
  'Particle Burst',
  'None',
];

export const Stage3SceneScript: React.FC<Stage3SceneScriptProps> = ({
  stage2Data,
  data,
  updateData,
  onPrevStage,
  onNextStage,
  runId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

  const showDemoNotice = () => setIsDemoNoticeOpen(true);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateScript = async () => {
    if (isLoading) return;
    if (!data.selectedModel) {
      setGenerationError('Choose an AI model before starting synthesis.');
      return;
    }
    if (!stage2Data.chapters.length) {
      setGenerationError('Create the storyline in Stage 2 before generating a production script.');
      return;
    }
    setIsLoading(true);
    setGenerationError(null);
    const input = {
      chapters: stage2Data.chapters,
      visualStyle: '2D Vector / Pixar Hybrid',
      targetAudience: 'General Public',
      targetDuration: stage2Data.totalEstimatedDuration || 60,
      selectedModel: data.selectedModel,
    };
    try {
      const sample = await loadDemoSampleOutput<Stage3Data>('photosynthesis', 'stage3', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved production-script sample yet.');
      updateData(sample.output);
      await saveStageInputOutput(runId || null, 3, input, sample.output, sample.output);
    } catch (err) {
      console.error('Failed to generate script:', err);
      setGenerationError(err instanceof Error ? err.message : 'Unable to generate the production script.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSceneChange = (_id: string, _field: keyof SceneScriptItem, _value: unknown) => showDemoNotice();

  const handleAddScene = () => showDemoNotice();

  const handleDuplicateScene = (_scene: SceneScriptItem) => showDemoNotice();

  const handleDeleteScene = (_id: string) => showDemoNotice();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Stage Banner */}
      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Stage 03: Production Script & Visual Cues</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Production Script & Camera Directions
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Deconstruct the storyline into scene-by-scene script cards detailing dialogues, camera angles, lighting mood, motion graphics, and background music queues.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onPrevStage}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stage 02</span>
            </button>

            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#0F1116] hover:bg-slate-800 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400 hover:text-white transition shadow-lg"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>AI Model: <strong className="text-white ml-1">{data.selectedModel || 'Select model'}</strong></span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center space-x-1.5">
              <Music className="w-3.5 h-3.5 text-blue-400" />
              <span>Global Background Music Atmosphere</span>
            </label>
            <select
              value={data.globalMusicGenre}
              onFocus={showDemoNotice}
              onChange={showDemoNotice}
              className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Uplifting Lo-Fi Beats">Uplifting Lo-Fi Beats</option>
              <option value="Cinematic Orchestral">Cinematic Orchestral</option>
              <option value="Upbeat Synthwave">Upbeat Synthwave</option>
              <option value="Acoustic Guitar Bright">Acoustic Guitar Bright</option>
              <option value="Ambient Scientific Drone">Ambient Scientific Drone</option>
              <option value="Playful Chiptune">Playful 8-Bit Chiptune</option>
            </select>
          </div>

          <div className="md:col-span-7 flex justify-end">
            <button
              onClick={handleGenerateScript}
              disabled={isLoading || !data.selectedModel || !stage2Data.chapters.length}
              className="w-full md:w-auto px-5 py-2.5 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Drafting Scene Script Cards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Full Production Script</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scene Cards List */}
      {data.scenes.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Production Scene Script Cards ({data.scenes.length})</span>
            </h3>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddScene}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14161C] hover:bg-slate-800 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>

              <button
                onClick={onNextStage}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-900/20 transition"
              >
                <span>Next Step: Voiceover & Assets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {data.scenes.map((scene) => (
              <div
                key={scene.id}
                className="bg-[#14161C] border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 shadow-xl transition space-y-4"
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      #{scene.sceneNumber.toString().padStart(2, '0')}
                    </span>
                    <input
                      type="text"
                      value={scene.sceneTitle}
                      readOnly
                      onFocus={showDemoNotice}
                      onChange={(e) => handleSceneChange(scene.id, 'sceneTitle', e.target.value)}
                      className="bg-[#0F1116] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition w-64 sm:w-80"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 bg-[#0F1116] px-3 py-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">Duration:</span>
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={scene.durationSec}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'durationSec', parseInt(e.target.value) || 5)}
                        className="w-12 bg-transparent text-xs font-bold text-blue-400 focus:outline-none text-center"
                      />
                      <span className="text-[10px] text-slate-500">sec</span>
                    </div>

                    <button
                      onClick={() => handleDuplicateScene(scene)}
                      className="p-1.5 text-slate-400 hover:text-white bg-[#0F1116] hover:bg-slate-800 rounded-lg border border-slate-800 transition"
                      title="Duplicate Scene"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Script Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Visuals & Dialogue (7 Cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1 flex items-center space-x-1">
                        <Video className="w-3.5 h-3.5 text-blue-400" />
                        <span>Visual Description & Background Elements</span>
                      </label>
                      <textarea
                        value={scene.visualDescription}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'visualDescription', e.target.value)}
                        rows={3}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest block mb-1 font-bold">
                        Spoken Narration / Dialogue Script
                      </label>
                      <textarea
                        value={scene.dialogueNarrative}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'dialogueNarrative', e.target.value)}
                        rows={3}
                        className="w-full bg-[#0F1116] border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200 focus:outline-none focus:border-blue-500 transition leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Right Column: Camera, Motion & Lighting (5 Cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1 flex items-center space-x-1 uppercase tracking-widest">
                          <Camera className="w-3 h-3 text-blue-400" />
                          <span>Camera Angle</span>
                        </label>
                        <select
                          value={scene.cameraAngle}
                          onFocus={showDemoNotice}
                          onChange={(e) => handleSceneChange(scene.id, 'cameraAngle', e.target.value)}
                          className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {CAMERA_ANGLES.map((angle) => (
                            <option key={angle} value={angle}>{angle}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1 flex items-center space-x-1 uppercase tracking-widest">
                          <Sparkle className="w-3 h-3 text-amber-400" />
                          <span>Motion Graphic</span>
                        </label>
                        <select
                          value={scene.motionGraphicType}
                          onFocus={showDemoNotice}
                          onChange={(e) => handleSceneChange(scene.id, 'motionGraphicType', e.target.value)}
                          className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {MOTION_GRAPHICS.map((mg) => (
                            <option key={mg} value={mg}>{mg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-widest">
                        Lighting & Atmosphere
                      </label>
                      <input
                        type="text"
                        value={scene.lightingMood}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'lightingMood', e.target.value)}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-widest">
                        Scene Background Music Mood
                      </label>
                      <input
                        type="text"
                        value={scene.bgMusicPrompt}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'bgMusicPrompt', e.target.value)}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Prompts Section: Scene Image Prompt & Scene Video Prompt */}
                <div className="border-t border-slate-800/80 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>AI Production Prompts (Image & Video Generation)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Scene Image Generation Prompt (Stage 5 Link) */}
                    <div className="bg-[#0F1116] border border-slate-800 hover:border-blue-500/40 rounded-xl p-3.5 space-y-2.5 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Scene Image Prompt</span>
                        </div>
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                          <Link className="w-3 h-3" />
                          <span>Links to Stage 5</span>
                        </span>
                      </div>

                      <textarea
                        value={scene.imagePrompt || scene.visualDescription}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'imagePrompt', e.target.value)}
                        rows={3}
                        placeholder="Detailed visual prompt for generating the still scene keyframe image in Stage 5..."
                        className="w-full bg-[#14161C] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition leading-relaxed"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Used by Gemini / Imagen in Stage 5 keyframe generator</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(scene.imagePrompt || scene.visualDescription, `img-${scene.id}`)}
                          className="flex items-center space-x-1 px-2 py-1 bg-[#14161C] hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
                        >
                          {copiedId === `img-${scene.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `img-${scene.id}` ? 'Copied!' : 'Copy Prompt'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Scene Video Generation Prompt (References Scene Image) */}
                    <div className="bg-[#0F1116] border border-slate-800 hover:border-blue-500/40 rounded-xl p-3.5 space-y-2.5 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Film className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-white">Scene Video Prompt</span>
                        </div>
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-[10px] font-semibold text-blue-400">
                          <ImageIcon className="w-3 h-3" />
                          <span>References Scene Image</span>
                        </span>
                      </div>

                      <textarea
                        value={scene.videoPrompt || `Using the Stage 5 scene keyframe image as visual reference: ${scene.cameraAngle} camera motion with smooth animation.`}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleSceneChange(scene.id, 'videoPrompt', e.target.value)}
                        rows={3}
                        placeholder="Video prompt referencing the Stage 5 scene image keyframe as visual base..."
                        className="w-full bg-[#14161C] border border-slate-800 rounded-lg p-2.5 text-xs text-blue-200 focus:outline-none focus:border-blue-500 transition leading-relaxed font-mono"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Video AI uses Stage 5 image keyframe as visual reference</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(scene.videoPrompt || `Using the Stage 5 scene keyframe image as visual reference: ${scene.cameraAngle} camera motion.`, `vid-${scene.id}`)}
                          className="flex items-center space-x-1 px-2 py-1 bg-[#14161C] hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
                        >
                          {copiedId === `vid-${scene.id}` ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `vid-${scene.id}` ? 'Copied!' : 'Copy Prompt'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#14161C] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Scene Script Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click "Generate Full Production Script" above to translate storyline chapters into scene-by-scene script cards.
            </p>
          </div>
          {generationError && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{generationError}</p>}

          <button
            onClick={handleGenerateScript}
            disabled={isLoading || !data.selectedModel || !stage2Data.chapters.length}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-lg transition"
          >
            Generate Script Cards
          </button>
        </div>
      )}

      {/* Model Selector Modal */}
      <ModelSelectorModal
        category="text"
        selectedModel={data.selectedModel}
        onSelectModel={(m) => { setGenerationError(null); updateData({ selectedModel: m, scenes: [] }); }}
        stageName="Stage 3 (Scene Script Director)"
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {isDemoNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="demo-notice-title" onMouseDown={() => setIsDemoNoticeOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-blue-500/30 bg-[#14161C] p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Demo version</p>
                <h2 id="demo-notice-title" className="mt-1 text-lg font-bold text-white">Editing is unavailable</h2>
              </div>
              <button type="button" onClick={() => setIsDemoNoticeOpen(false)} aria-label="Close demo notice" className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">This is a demo version. Editing the production script in Stage 3 is not available for input.</p>
            <button type="button" onClick={() => setIsDemoNoticeOpen(false)} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
};
