import React, { useState } from 'react';
import { Stage1Data, Stage3Data, Stage5Data, SceneImageAsset } from '../types';
import { ModelSelectorModal } from './ModelSelectorModal';
import { saveStageInputOutput } from '../utils/runStorage';
import { loadDemoSampleOutput } from '../data/demoRun';
import { 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Cpu, 
  Wand2, 
  RefreshCw, 
  CheckCircle2, 
  Maximize2, 
  Sliders, 
  Upload, 
  Eye, 
  X,
  Palette
} from 'lucide-react';

interface Stage5SceneImagesProps {
  stage1Data: Stage1Data;
  stage3Data: Stage3Data;
  data: Stage5Data;
  updateData: (fields: Partial<Stage5Data>) => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  runId?: string | null;
}

export const Stage5SceneImages: React.FC<Stage5SceneImagesProps> = ({
  stage1Data,
  stage3Data,
  data,
  updateData,
  onPrevStage,
  onNextStage,
  runId,
}) => {
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string; prompt: string } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateSceneImage = async (sceneId: string, fallbackDesc: string, title: string, sceneNum: number) => {
    if (!data.selectedModel) {
      setGenerationError('Choose an image model before starting synthesis.');
      return;
    }
    setGenerationError(null);
    const sceneObj = stage3Data.scenes.find((s) => s.id === sceneId);
    const initialPrompt = sceneObj?.imagePrompt || sceneObj?.visualDescription || fallbackDesc;
    
    // Read the current prompt directly from state if user edited the textarea
    const existingAsset = data.sceneImages[sceneId];
    const promptToUse = existingAsset?.prompt && existingAsset.prompt.trim().length > 0 
      ? existingAsset.prompt 
      : initialPrompt;

    const currentAsset: SceneImageAsset = {
      sceneId,
      prompt: promptToUse,
      aspectRatio: data.globalAspectRatio,
      isGenerating: true,
      imageUrl: existingAsset?.imageUrl,
      modelUsed: data.selectedModel,
    };

    updateData({
      sceneImages: {
        ...data.sceneImages,
        [sceneId]: currentAsset,
      },
    });

    try {
      const input = {
        prompt: promptToUse,
        aspectRatio: data.globalAspectRatio,
        selectedModel: data.selectedModel,
        visualStyle: stage1Data.visualStyle,
      };
      const sample = await loadDemoSampleOutput<Stage5Data>(stage1Data.presetId, 'stage5', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved image-generation sample yet.');
      const savedAsset = sample.output.sceneImages[sceneId];
      if (!savedAsset) throw new Error('No saved keyframe is available for this scene.');
      const sceneImages = { ...data.sceneImages, [sceneId]: { ...currentAsset, ...savedAsset, prompt: promptToUse, isGenerating: false } };
      updateData({ sceneImages });
      await saveStageInputOutput(runId || null, 5, input, savedAsset, { ...data, sceneImages });
    } catch (err) {
      console.error('Error generating image:', err);
      setGenerationError(err instanceof Error ? err.message : 'Unable to synthesize the keyframe.');
      updateData({
        sceneImages: {
          ...data.sceneImages,
          [sceneId]: {
            ...currentAsset,
            isGenerating: false,
          },
        },
      });
    }
  };

  const handleGenerateAllImages = async () => {
    if (isBatchGenerating) return;
    if (!data.selectedModel) {
      setGenerationError('Choose an image model before starting synthesis.');
      return;
    }
    setIsBatchGenerating(true);
    setGenerationError(null);
    try {
      const sample = await loadDemoSampleOutput<Stage5Data>(stage1Data.presetId, 'stage5', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved image-generation sample yet.');
      updateData(sample.output);
      await saveStageInputOutput(runId || null, 5, { selectedModel: data.selectedModel }, sample.output, sample.output);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Unable to synthesize the keyframes.');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handlePromptChange = (sceneId: string, promptText: string) => {
    const currentAsset = data.sceneImages[sceneId] || {
      sceneId,
      prompt: promptText,
      aspectRatio: data.globalAspectRatio,
    };
    updateData({
      sceneImages: {
        ...data.sceneImages,
        [sceneId]: { ...currentAsset, prompt: promptText },
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Stage Banner */}
      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Stage 05: Scene Keyframe Art & Visual Assets</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              AI Keyframe Visual Generation
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Generate custom visual artwork keyframes for each scene using Gemini Image models or stylized motion vector graphics matching your visual theme.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onPrevStage}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stage 04</span>
            </button>

            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#0F1116] hover:bg-slate-800 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400 hover:text-white transition shadow-lg"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Image Model: <strong className="text-white ml-1">{data.selectedModel || 'Select model'}</strong></span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings & Batch Toolbar */}
      <div className="bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Maximize2 className="w-4 h-4 text-blue-400" />
              <span>Aspect Ratio:</span>
            </span>

            <div className="flex items-center space-x-2">
              {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateData({ globalAspectRatio: ratio })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    data.globalAspectRatio === ratio
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-[#0F1116] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '9:16' ? '(Shorts)' : '(Square)'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateAllImages}
            disabled={isBatchGenerating || !data.selectedModel || stage3Data.scenes.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-blue-900/20 transition flex items-center space-x-2"
          >
            {isBatchGenerating ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin" />
                <span>Generating All Keyframes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Batch Generate All Scene Art</span>
              </>
            )}
          </button>
        </div>
        {generationError && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{generationError}</p>}
      </div>

      {/* Scene Keyframes Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Palette className="w-4 h-4 text-blue-400" />
            <span>Scene Keyframe Gallery ({stage3Data.scenes.length})</span>
          </h3>

          <button
            onClick={onNextStage}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-900/20 transition"
          >
            <span>Next Step: Final Video Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stage3Data.scenes.map((scene) => {
            const initialPrompt = scene.imagePrompt || scene.visualDescription;
            const asset = data.sceneImages[scene.id] || {
              sceneId: scene.id,
              prompt: initialPrompt,
              aspectRatio: data.globalAspectRatio,
            };

            const currentPrompt = asset.prompt || initialPrompt;
            const imageUrl = asset.imageUrl;

            return (
              <div
                key={scene.id}
                className="bg-[#14161C] border border-slate-800 hover:border-blue-500/40 rounded-xl overflow-hidden shadow-xl transition space-y-3 p-5"
              >
                {/* Image Preview Container */}
                <div className="relative group rounded-lg overflow-hidden bg-[#0F1116] border border-slate-800 aspect-video flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={scene.sceneTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Awaiting image synthesis</span>
                  )}

                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                    {imageUrl && <button
                      onClick={() => setPreviewImage({ title: scene.sceneTitle, url: imageUrl, prompt: currentPrompt })}
                      className="p-2.5 bg-[#14161C] text-white rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                      title="Inspect full image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>}
                    <button
                      onClick={() => handleGenerateSceneImage(scene.id, currentPrompt, scene.sceneTitle, scene.sceneNumber)}
                      disabled={asset.isGenerating}
                      className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-lg shadow-lg hover:bg-blue-500 transition flex items-center space-x-1.5"
                    >
                      {asset.isGenerating ? <Wand2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Regenerate Keyframe</span>
                    </button>
                  </div>

                  {/* Scene Number Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#14161C]/90 border border-slate-700 text-white font-bold text-xs rounded-lg backdrop-blur-md">
                    Scene #{scene.sceneNumber.toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Prompt & Title Editor */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{scene.sceneTitle}</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Editable Image Prompt
                    </span>
                  </div>

                  <textarea
                    value={currentPrompt}
                    onChange={(e) => handlePromptChange(scene.id, e.target.value)}
                    rows={3}
                    placeholder="Customize visual keyframe prompt..."
                    className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition leading-relaxed font-mono"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md font-mono">
                      <Cpu className="w-3 h-3" />
                      <span>Model: <strong>{asset.modelUsed || data.selectedModel}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateSceneImage(scene.id, currentPrompt, scene.sceneTitle, scene.sceneNumber)}
                      disabled={asset.isGenerating}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {asset.isGenerating ? (
                        <>
                          <Wand2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Keyframe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Image Zoom Inspector */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#14161C] border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs text-white">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#0F1116] rounded-lg border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg overflow-hidden bg-black border border-slate-800">
              <img src={previewImage.url} alt={previewImage.title} referrerPolicy="no-referrer" className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
            </div>

            <p className="text-xs text-slate-300 bg-[#0F1116] p-3 rounded-lg border border-slate-800 font-mono leading-relaxed">
              <strong>Prompt:</strong> {previewImage.prompt}
            </p>
          </div>
        </div>
      )}

      {/* Model Selector Modal */}
      <ModelSelectorModal
        category="image"
        selectedModel={data.selectedModel}
        onSelectModel={(m) => { setGenerationError(null); updateData({ selectedModel: m, sceneImages: {} }); }}
        stageName="Stage 5 (Scene Keyframe Artist)"
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />
    </div>
  );
};
