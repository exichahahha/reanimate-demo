import React from 'react';
import { PipelineStageNumber } from '../types';
import { SavedRun } from '../utils/runStorage';
import { 
  FileText, 
  GitCommit, 
  Clapperboard, 
  Mic, 
  Image as ImageIcon, 
  Film, 
  RotateCcw, 
  Sparkles, 
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  currentStage: PipelineStageNumber;
  setStage: (stage: PipelineStageNumber) => void;
  onReset: () => void;
  runs: SavedRun[];
  currentRunId: string | null;
  onLoadRun: (runId: string) => void;
  isLoadingRun: boolean;
}

const STAGES: { stage: PipelineStageNumber; name: string; icon: React.ReactNode; tag: string }[] = [
  { stage: 1, name: '1. Notes & Theme', icon: <FileText className="w-4 h-4" />, tag: 'PDF / Concept' },
  { stage: 2, name: '2. Storyline', icon: <GitCommit className="w-4 h-4" />, tag: 'Interactive Arc' },
  { stage: 3, name: '3. Scene Script', icon: <Clapperboard className="w-4 h-4" />, tag: 'Visuals & Camera' },
  { stage: 4, name: '4. Voice & Audio', icon: <Mic className="w-4 h-4" />, tag: 'TTS & Music' },
  { stage: 5, name: '5. Keyframes', icon: <ImageIcon className="w-4 h-4" />, tag: 'AI Scene Art' },
  { stage: 6, name: '6. Video Studio', icon: <Film className="w-4 h-4" />, tag: 'Canvas & Export' },
];

export const Header: React.FC<HeaderProps> = ({ currentStage, setStage, onReset, runs, currentRunId, onLoadRun, isLoadingRun }) => {
  return (
    <header className="bg-[#0F1116] border-b border-slate-800 sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setStage(1)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">REANIMATE</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  Stage {currentStage.toString().padStart(2, '0')} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Educational Video Engine</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-3">
            <select
              value={currentRunId || ''}
              onChange={(event) => onLoadRun(event.target.value)}
              disabled={isLoadingRun || runs.length === 0}
              className="max-w-[180px] bg-[#14161C] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300"
              title="Replay a saved pipeline run"
            >
              <option value="">Saved Demo Runs</option>
              {runs.map((run) => <option key={run.id} value={run.id}>{run.name || run.id}</option>)}
            </select>
            <button
              onClick={() => {
                if (window.confirm('Reset current project and clear pipeline data?')) {
                  onReset();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition"
              title="Reset project and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Pipeline</span>
            </button>
          </div>
        </div>

        {/* Stage Progress Pipeline Stepper */}
        <div className="py-2.5 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          <div className="flex items-center min-w-max space-x-2">
            {STAGES.map((s, idx) => {
              const isActive = currentStage === s.stage;
              const isPast = currentStage > s.stage;

              return (
                <React.Fragment key={s.stage}>
                  <button
                    onClick={() => setStage(s.stage)}
                    className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 ring-1 ring-blue-500/20'
                        : isPast
                        ? 'bg-[#14161C] text-slate-300 border border-slate-800 hover:bg-slate-800/80'
                        : 'bg-[#14161C]/50 text-slate-500 border border-slate-800/60 hover:bg-slate-800/50 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-blue-500 text-white' : isPast ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {s.stage.toString().padStart(2, '0')}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold leading-none">{s.name}</div>
                      <div className={`text-[10px] mt-0.5 leading-none ${isActive ? 'text-blue-300' : 'text-slate-500'}`}>{s.tag}</div>
                    </div>
                  </button>

                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
