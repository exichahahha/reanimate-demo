import React, { useState } from 'react';
import { Stage1Data, Stage2Data, StorylineChapter } from '../types';
import { ModelSelectorModal } from './ModelSelectorModal';
import { loadDemoSampleOutput } from '../data/demoRun';
import { saveStageInputOutput } from '../utils/runStorage';
import { 
  GitCommit, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Cpu, 
  Wand2, 
  Play, 
  Film, 
  Layers, 
  Tv, 
  Sparkle,
  X
} from 'lucide-react';

interface Stage2StorylineProps {
  stage1Data: Stage1Data;
  data: Stage2Data;
  updateData: (fields: Partial<Stage2Data>) => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  runId?: string | null;
}

export const Stage2Storyline: React.FC<Stage2StorylineProps> = ({
  stage1Data,
  data,
  updateData,
  onPrevStage,
  onNextStage,
  runId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

  const showDemoNotice = () => setIsDemoNoticeOpen(true);

  const handleGenerateStoryline = async () => {
    if (isLoading) return;
    if (!data.selectedModel) {
      setGenerationError('Choose an AI model before starting synthesis.');
      return;
    }
    if (!stage1Data.parsedOutput) {
      setGenerationError('Synthesize the notes in Stage 1 before creating a storyline.');
      return;
    }
    setIsLoading(true);
    setGenerationError(null);
    const input = {
      parsedNotes: stage1Data.parsedOutput,
      themeIdea: stage1Data.themeIdea,
      targetAudience: stage1Data.targetAudience,
      visualStyle: stage1Data.visualStyle,
      narrativeTone: data.narrativeTone,
      targetDuration: stage1Data.targetDuration,
      selectedModel: data.selectedModel,
    };
    try {
      const sample = await loadDemoSampleOutput<Stage2Data>(stage1Data.presetId, 'stage2', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved storyline sample yet.');
      updateData(sample.output);
      await saveStageInputOutput(runId || null, 2, input, sample.output, sample.output);
    } catch (err) {
      console.error('Failed to generate storyline:', err);
      setGenerationError(err instanceof Error ? err.message : 'Unable to generate the storyline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapterChange = (_id: string, _field: keyof StorylineChapter, _value: unknown) => showDemoNotice();

  const handleAddChapter = () => showDemoNotice();

  const handleDeleteChapter = (_id: string) => showDemoNotice();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Stage Banner */}
      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <GitCommit className="w-3.5 h-3.5" />
              <span>Stage 02: Interactive Storyline Arc</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Interactive Storyline Architecture
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Transform study notes into a structured narrative flow with interactive hooks, animation cues, and pacing tailored to your audience.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onPrevStage}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#0F1116] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stage 01</span>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Narrative Tone & Voice
            </label>
            <select
              value={data.narrativeTone}
              onFocus={showDemoNotice}
              onChange={showDemoNotice}
              className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Enthusiastic & Friendly">Enthusiastic & Energetic</option>
              <option value="Clear & Academic">Clear, Precise & Academic</option>
              <option value="Storytelling & Mystery">Storytelling & Mystery Narrative</option>
              <option value="Humorous & Relatable">Humorous & Relatable</option>
              <option value="Dramatic & Cinematic">Dramatic & Epic Cinematic</option>
            </select>
          </div>

          <div className="md:col-span-7 flex justify-end">
            <button
              onClick={handleGenerateStoryline}
              disabled={isLoading || !data.selectedModel || !stage1Data.parsedOutput}
              className="w-full md:w-auto px-5 py-2.5 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Building Storyline Chapters...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Storyline Arc</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Flow & Interactive Cards */}
      {data.chapters.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Interactive Chapter Nodes ({data.chapters.length})</span>
            </h3>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddChapter}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14161C] hover:bg-slate-800 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>

              <button
                onClick={onNextStage}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-900/20 transition"
              >
                <span>Next Step: Scripting</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chapter Cards List */}
          <div className="space-y-4">
            {data.chapters.map((chap) => (
              <div
                key={chap.id}
                className="bg-[#14161C] border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 shadow-xl transition space-y-4 relative group"
              >
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                      {chap.chapterNumber.toString().padStart(2, '0')}
                    </span>
                    <input
                      type="text"
                      value={chap.title}
                      readOnly
                      onFocus={showDemoNotice}
                      onChange={(e) => handleChapterChange(chap.id, 'title', e.target.value)}
                      className="bg-[#0F1116] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition w-72 sm:w-96"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-400 bg-[#0F1116] px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                      {chap.durationPercent}% of video
                    </span>
                    <button
                      onClick={() => handleDeleteChapter(chap.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Concept Focus & Hook */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                        Concept Focus
                      </label>
                      <input
                        type="text"
                        value={chap.conceptFocus}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleChapterChange(chap.id, 'conceptFocus', e.target.value)}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-blue-400 font-semibold focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                        Narrative Hook & Dialogue
                      </label>
                      <textarea
                        value={chap.narrativeHook}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleChapterChange(chap.id, 'narrativeHook', e.target.value)}
                        rows={3}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Visual Animation Cue & Interactive Element */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1 flex items-center space-x-1">
                        <Tv className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Visual Animation Cue</span>
                      </label>
                      <textarea
                        value={chap.visualAnimationCue}
                        readOnly
                        onFocus={showDemoNotice}
                        onChange={(e) => handleChapterChange(chap.id, 'visualAnimationCue', e.target.value)}
                        rows={2}
                        className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    {chap.interactiveElement !== undefined && (
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1 flex items-center space-x-1">
                          <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Interactive Element Cue</span>
                        </label>
                        <input
                          type="text"
                          value={chap.interactiveElement}
                          readOnly
                          onFocus={showDemoNotice}
                          onChange={(e) => handleChapterChange(chap.id, 'interactiveElement', e.target.value)}
                          className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2 text-xs text-amber-300 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#14161C] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <GitCommit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Storyline Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click the "Generate Storyline Arc" button above to turn Stage 01 notes into an educational narrative structure.
            </p>
          </div>
          {generationError && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{generationError}</p>}

          <button
            onClick={handleGenerateStoryline}
            disabled={isLoading || !data.selectedModel || !stage1Data.parsedOutput}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-lg transition"
          >
            Generate Storyline Now
          </button>
        </div>
      )}

      {/* Model Selector Modal */}
      <ModelSelectorModal
        category="text"
        selectedModel={data.selectedModel}
        onSelectModel={(m) => { setGenerationError(null); updateData({ selectedModel: m, chapters: [] }); }}
        stageName="Stage 2 (Storyline Architect)"
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {isDemoNoticeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-notice-title"
          onMouseDown={() => setIsDemoNoticeOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-blue-500/30 bg-[#14161C] p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Demo version</p>
                <h2 id="demo-notice-title" className="mt-1 text-lg font-bold text-white">Editing is unavailable</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoNoticeOpen(false)}
                aria-label="Close demo notice"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              This is a demo version. Editing the storyline in Stage 2 is not available for input.
            </p>
            <button
              type="button"
              onClick={() => setIsDemoNoticeOpen(false)}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
