import React from 'react';
import { AI_MODELS } from '../data/sampleNotes';
import { Cpu, Check, Zap, Sparkles, X, Settings2 } from 'lucide-react';

interface ModelSelectorModalProps {
  category: 'text' | 'image' | 'audio' | 'music' | 'video';
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  stageName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  category,
  selectedModel,
  onSelectModel,
  stageName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const models = AI_MODELS[category] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#14161C] border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Model Architecture Selector</h3>
              <p className="text-xs text-slate-400">Configure engine for <span className="text-blue-400 font-semibold">{stageName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#0F1116] rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-3">
          <p className="text-xs font-medium text-slate-400 flex items-center space-x-1">
            <Settings2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Select preferred AI Model & Architecture:</span>
          </p>

          <div className="space-y-2.5">
            {models.map((m: any) => {
              const isSelected = selectedModel === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id);
                  }}
                  className={`p-4 rounded-lg border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                      : 'bg-[#0F1116] border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{m.name}</span>
                        {m.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            m.isPaid 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'border border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            Apply Model Choice
          </button>
        </div>
      </div>
    </div>
  );
};
