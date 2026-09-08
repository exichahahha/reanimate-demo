import React, { useState } from 'react';
import { Stage1Data } from '../types';
import { SAMPLE_NOTES } from '../data/sampleNotes';
import { loadDemoSampleOutput } from '../data/demoRun';
import { saveStageInputOutput } from '../utils/runStorage';
import { ModelSelectorModal } from './ModelSelectorModal';
import { 
  FileUp, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Cpu, 
  Palette, 
  Users, 
  Clock, 
  Lightbulb, 
  ArrowRight, 
  FileText,
  Tag,
  Layers,
  Wand2,
  Trash2,
  X
} from 'lucide-react';

interface Stage1NotesInputProps {
  data: Stage1Data;
  updateData: (fields: Partial<Stage1Data>) => void;
  onNextStage: () => void;
  runId?: string | null;
  onCreateRun?: () => Promise<string>;
  onPresetSelected?: (presetId: string) => void;
}

export const Stage1NotesInput: React.FC<Stage1NotesInputProps> = ({
  data,
  updateData,
  onNextStage,
  runId,
  onCreateRun,
  onPresetSelected,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

  const showDemoNotice = () => setIsDemoNoticeOpen(true);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    showDemoNotice();
  };

  const handleProcessNotes = async () => {
    if (isLoading) return;
    if (!data.selectedModel) {
      setGenerationError('Choose an AI model before starting synthesis.');
      return;
    }
    setIsLoading(true);
    setGenerationError(null);
    const input = {
      noteContent: data.noteContent,
      noteFileBase64: data.noteFileBase64,
      noteFileMime: data.noteFileMime,
      themeIdea: data.themeIdea,
      targetAudience: data.targetAudience,
      visualStyle: data.visualStyle,
      selectedModel: data.selectedModel,
    };
    try {
      const sample = await loadDemoSampleOutput(data.presetId, 'stage1', data.selectedModel);
      if (!sample) throw new Error('This model does not have a saved notes-processing sample yet.');
      const parsed = sample.output;
      updateData({ parsedOutput: parsed });
      const activeRunId = runId || (onCreateRun ? await onCreateRun() : null);
      await saveStageInputOutput(activeRunId, 1, input, parsed, { ...data, parsedOutput: parsed });
    } catch (err) {
      console.error('Failed to process stage 1 notes:', err);
      setGenerationError(err instanceof Error ? err.message : 'Unable to synthesize these notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPresetSample = async (preset: typeof SAMPLE_NOTES[0]) => {
    let savedStage1: Partial<Stage1Data> | undefined;

    if (preset.id === 'photosynthesis') {
      try {
        const response = await fetch('/api/demo-sample/photosynthesis');
        if (response.ok) {
          const sample = await response.json() as { stage1?: Partial<Stage1Data> };
          savedStage1 = sample.stage1;
        }
      } catch (error) {
        console.warn('Unable to load saved Photosynthesis preset data:', error);
      }
    }

    updateData({
      noteContent: savedStage1?.noteContent || preset.content,
      noteFileName: undefined,
      noteFileBase64: undefined,
      noteFileMime: undefined,
      themeIdea: savedStage1?.themeIdea || preset.suggestedTheme,
      targetAudience: savedStage1?.targetAudience || data.targetAudience,
      visualStyle: savedStage1?.visualStyle || data.visualStyle,
      targetDuration: savedStage1?.targetDuration || data.targetDuration,
      presetId: preset.id,
      selectedModel: '',
      parsedOutput: savedStage1?.parsedOutput,
    });
    onPresetSelected?.(preset.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#14161C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stage 01: Source Document & Vision</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Educational Notes & Video Conception
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Upload study PDFs, lecture notes, or research papers. EduFlow AI analyzes key concepts and crafts the overarching narrative framework.
            </p>
          </div>

          <button
            onClick={() => setIsModelModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0F1116] hover:bg-slate-800 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400 hover:text-white transition shadow-lg shrink-0"
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>AI Model: <strong className="text-white ml-1">{data.selectedModel || 'Select model'}</strong></span>
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File & Text Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Sample Quick Buttons */}
          <div className="bg-[#14161C] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Load Preset Sample Notes</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAMPLE_NOTES.slice(0, 1).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => { void loadPresetSample(sample); }}
                  aria-pressed={data.presetId === sample.id}
                  className={`p-3 rounded-lg text-left transition group border ${
                    data.presetId === sample.id
                      ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/30'
                      : 'bg-[#0F1116] border-slate-800 hover:bg-slate-800/80 hover:border-blue-500/40'
                  }`}
                >
                  <div className={`text-xs font-bold transition flex items-center justify-between ${data.presetId === sample.id ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-400'}`}>
                    <span className="flex items-center gap-1.5">
                      {data.presetId === sample.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {sample.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${data.presetId === sample.id ? 'text-blue-300 bg-blue-500/15' : 'text-slate-500 bg-slate-800/80'}`}>{sample.subject}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PDF / File Dropzone & Text Area */}
          <div className="bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Source Material & Document</span>
              </label>

              {data.noteFileName && (
                <button
                  onClick={showDemoNotice}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-[#0F1116] hover:bg-slate-800/50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  e.currentTarget.value = '';
                  showDemoNotice();
                }}
              />
              <label
                htmlFor="file-upload"
                onClick={(e) => { e.preventDefault(); showDemoNotice(); }}
                className="cursor-pointer space-y-2 block"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200">Click to upload PDF or Document</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Supports PDF, TXT, Markdown files</span>
                </div>
                {data.noteFileName && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Attached: {data.noteFileName}</span>
                  </div>
                )}
              </label>
            </div>

            {/* Direct Text Editor */}
            <div>
              <span className="text-[11px] text-slate-400 mb-1.5 block">Or paste raw notes / transcript text below:</span>
              <textarea
                value={data.noteContent}
                readOnly
                onFocus={showDemoNotice}
                onClick={showDemoNotice}
                placeholder="Paste lecture notes, textbook chapters, or key topic outlines here..."
                rows={7}
                className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition leading-relaxed font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Creative Theme & Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#14161C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Video Direction & Parameters</span>
            </h3>

            {/* Video Idea / Theme Prompt */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Core Storyline Metaphor / Idea
              </label>
              <textarea
                value={data.themeIdea}
                onChange={(e) => updateData({ themeIdea: e.target.value })}
                placeholder="e.g. A tiny superhero chloroplast converting sunlight into chemical energy for a metropolis tree..."
                rows={3}
                className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Target Audience</span>
              </label>
              <select
                value={data.targetAudience}
                onChange={(e) => updateData({ targetAudience: e.target.value })}
                className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="Elementary (Ages 6-11)">Elementary School (Ages 6-11)</option>
                <option value="Middle/High School (Ages 12-17)">Middle & High School (Ages 12-17)</option>
                <option value="College / Higher Ed">College / University Students</option>
                <option value="General Public">General Public / Casual Viewers</option>
                <option value="Technical Experts">Technical Professionals & Researchers</option>
              </select>
            </div>

            {/* Visual Style */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Animation & Visual Style</span>
              </label>
              <select
                value={data.visualStyle}
                onChange={(e) => updateData({ visualStyle: e.target.value })}
                className="w-full bg-[#0F1116] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="3D Pixar Animation">3D Pixar Cinematic Style</option>
                <option value="2D Vector Motion Graphics">2D Flat Vector Motion Graphics</option>
                <option value="Anime & Manga Style">Anime & Manga Graphic Style</option>
                <option value="Chalkboard / Whiteboard Explainer">Chalkboard & Sketch Explainer</option>
                <option value="Isometric Sci-Fi / Cyberpunk">Isometric Sci-Fi / Cyberpunk HUD</option>
                <option value="Vintage Textbook Illustration">Vintage Scientific Engraving</option>
              </select>
            </div>

            {/* Target Duration */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Video Duration</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[30, 60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateData({ targetDuration: sec })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      data.targetDuration === sec
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-[#0F1116] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleProcessNotes}
              disabled={isLoading || !data.selectedModel || (!data.noteContent && !data.noteFileBase64)}
              className={`w-full py-3 px-6 rounded-lg font-medium text-xs text-white transition-all shadow-lg flex items-center justify-center space-x-2 ${
                isLoading || !data.selectedModel || (!data.noteContent && !data.noteFileBase64)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Analyzing notes with the saved AI sample...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesis with AI</span>
                </>
              )}
            </button>
            {generationError && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{generationError}</p>}
          </div>
        </div>
      </div>

      {/* AI Parsed Results Section */}
      {data.parsedOutput && (
        <div className="bg-[#14161C] border border-blue-500/30 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-slideUp">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Concept Synthesis Output</h3>
                <p className="text-xs text-blue-300">Notes parsed successfully. Verify or edit key concepts below.</p>
              </div>
            </div>

            <button
              onClick={onNextStage}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-900/20 transition"
            >
              <span>Next Step: Storyline Concept</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="bg-[#0F1116] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Executive Summary</span>
              <p className="text-xs text-slate-300 leading-relaxed">{data.parsedOutput.summary}</p>
            </div>

            {/* Core Takeaway & Suggested Titles */}
            <div className="space-y-4">
              <div className="bg-[#0F1116] p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Core Learning Takeaway</span>
                <p className="text-xs text-slate-200 italic font-medium">"{data.parsedOutput.coreTakeaway}"</p>
              </div>

              <div className="bg-[#0F1116] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Suggested Video Titles</span>
                <div className="space-y-1.5">
                  {data.parsedOutput.suggestedTitles.map((t, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Concepts Tags */}
          <div className="bg-[#0F1116] p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Extracted Key Technical Concepts ({data.parsedOutput.keyConcepts.length})</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {data.parsedOutput.keyConcepts.map((concept, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium">
                  {concept}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Selector Modal */}
      <ModelSelectorModal
        category="text"
        selectedModel={data.selectedModel}
        onSelectModel={(m) => { setGenerationError(null); updateData({ selectedModel: m, parsedOutput: undefined }); }}
        stageName="Stage 1 (Notes Processing)"
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
                <h2 id="demo-notice-title" className="mt-1 text-lg font-bold text-white">Input is unavailable</h2>
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
              This is a demo version. Uploading documents and editing notes in Stage 1 are not available for input. You can only choose the given sample notes.
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
