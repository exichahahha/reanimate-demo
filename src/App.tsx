import React, { useEffect, useState } from 'react';
import { 
  PipelineStageNumber, 
  Stage1Data, 
  Stage2Data, 
  Stage3Data, 
  Stage4Data, 
  Stage5Data, 
  Stage6Data 
} from './types';
import { SAMPLE_NOTES } from './data/sampleNotes';
import { Header } from './components/Header';
import { Stage1NotesInput } from './components/Stage1NotesInput';
import { Stage2Storyline } from './components/Stage2Storyline';
import { Stage3SceneScript } from './components/Stage3SceneScript';
import { Stage4AssetsVoiceover } from './components/Stage4AssetsVoiceover';
import { Stage5SceneImages } from './components/Stage5SceneImages';
import { Stage6VideoStudio } from './components/Stage6VideoStudio';
import { createRun, listRuns, loadRun, saveStageData, SavedRun } from './utils/runStorage';

export default function App() {
  const [currentStage, setCurrentStage] = useState<PipelineStageNumber>(1);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [isLoadingRun, setIsLoadingRun] = useState(false);

  // Stage 1 State
  const [stage1Data, setStage1Data] = useState<Stage1Data>({
    presetId: SAMPLE_NOTES[0].id,
    noteContent: SAMPLE_NOTES[0].content,
    themeIdea: SAMPLE_NOTES[0].suggestedTheme,
    targetAudience: 'Middle/High School (Ages 12-17)',
    visualStyle: '3D Pixar Animation',
    targetDuration: 60,
    selectedModel: '',
  });

  // Stage 2 State
  const [stage2Data, setStage2Data] = useState<Stage2Data>({
    selectedModel: '',
    narrativeTone: 'Enthusiastic & Friendly',
    chapters: [],
    totalEstimatedDuration: 60,
  });

  // Stage 3 State
  const [stage3Data, setStage3Data] = useState<Stage3Data>({
    selectedModel: '',
    scenes: [],
    globalMusicGenre: 'Uplifting Lo-Fi Beats',
  });

  // Stage 4 State
  const [stage4Data, setStage4Data] = useState<Stage4Data>({
    selectedModel: '',
    selectedVoice: 'Kore',
    voiceoverAssets: {},
    bgMusicVolume: 0.3,
  });

  // Stage 5 State
  const [stage5Data, setStage5Data] = useState<Stage5Data>({
    selectedModel: '',
    sceneImages: {},
    globalAspectRatio: '16:9',
  });

  // Stage 6 State
  const [stage6Data, setStage6Data] = useState<Stage6Data>({
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    isExporting: false,
    exportProgress: 0,
    captionStyle: 'Bold Pop-up',
    showMotionGraphics: true,
    playbackSpeed: 1.0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const existing = await listRuns();
        if (active) {
          setRuns(existing);
        }
      } catch (error) {
        console.error('Unable to initialize pipeline storage:', error);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleCreateRun = async () => {
    if (runId) return runId;
    const newRun = await createRun();
    setRunId(newRun.id);
    setRuns((previous) => [newRun, ...previous]);
    return newRun.id;
  };

  const clearGeneratedStages = () => {
    setStage2Data({ selectedModel: '', narrativeTone: 'Enthusiastic & Friendly', chapters: [], totalEstimatedDuration: 60 });
    setStage3Data({ selectedModel: '', scenes: [], globalMusicGenre: 'Uplifting Lo-Fi Beats' });
    setStage4Data({ selectedModel: '', selectedVoice: 'Kore', voiceoverAssets: {}, bgMusicVolume: 0.3 });
    setStage5Data({ selectedModel: '', sceneImages: {}, globalAspectRatio: '16:9' });
    setStage6Data({ isPlaying: false, currentTime: 0, volume: 1, isExporting: false, exportProgress: 0, captionStyle: 'Bold Pop-up', showMotionGraphics: true, playbackSpeed: 1.0 });
  };

  useEffect(() => { void saveStageData(runId, 1, stage1Data); }, [runId, stage1Data]);
  useEffect(() => { void saveStageData(runId, 2, stage2Data); }, [runId, stage2Data]);
  useEffect(() => { void saveStageData(runId, 3, stage3Data); }, [runId, stage3Data]);
  useEffect(() => { void saveStageData(runId, 4, stage4Data); }, [runId, stage4Data]);
  useEffect(() => { void saveStageData(runId, 5, stage5Data); }, [runId, stage5Data]);
  useEffect(() => { void saveStageData(runId, 6, stage6Data); }, [runId, stage6Data]);

  const handleLoadRun = async (selectedRunId: string) => {
    if (!selectedRunId) return;
    setIsLoadingRun(true);
    try {
      const saved = await loadRun(selectedRunId);
      const stage1 = saved.stages.stage1?.data as Stage1Data | undefined;
      const stage2 = saved.stages.stage2?.data as Stage2Data | undefined;
      const stage3 = saved.stages.stage3?.data as Stage3Data | undefined;
      const stage4 = saved.stages.stage4?.data as Stage4Data | undefined;
      const stage5 = saved.stages.stage5?.data as Stage5Data | undefined;
      const stage6 = saved.stages.stage6?.data as Stage6Data | undefined;
      if (stage1) setStage1Data(stage1);
      if (stage2) setStage2Data(stage2);
      if (stage3) setStage3Data(stage3);
      if (stage4) setStage4Data(stage4);
      if (stage5) setStage5Data(stage5);
      if (stage6) setStage6Data(stage6);
      setRunId(selectedRunId);
      setCurrentStage(1);
    } catch (error) {
      console.error('Unable to replay pipeline run:', error);
    } finally {
      setIsLoadingRun(false);
    }
  };

  const handleResetPipeline = async () => {
    setRunId(null);
    setCurrentStage(1);
    setStage1Data({
      presetId: SAMPLE_NOTES[0].id,
      noteContent: SAMPLE_NOTES[0].content,
      themeIdea: SAMPLE_NOTES[0].suggestedTheme,
      targetAudience: 'Middle/High School (Ages 12-17)',
      visualStyle: '3D Pixar Animation',
      targetDuration: 60,
      selectedModel: '',
    });
    setStage2Data({
      selectedModel: '',
      narrativeTone: 'Enthusiastic & Friendly',
      chapters: [],
      totalEstimatedDuration: 60,
    });
    setStage3Data({
      selectedModel: '',
      scenes: [],
      globalMusicGenre: 'Uplifting Lo-Fi Beats',
    });
    setStage4Data({
      selectedModel: '',
      selectedVoice: 'Kore',
      voiceoverAssets: {},
      bgMusicVolume: 0.3,
    });
    setStage5Data({
      selectedModel: '',
      sceneImages: {},
      globalAspectRatio: '16:9',
    });
    setStage6Data({
      isPlaying: false,
      currentTime: 0,
      volume: 1,
      isExporting: false,
      exportProgress: 0,
      captionStyle: 'Bold Pop-up',
      showMotionGraphics: true,
      playbackSpeed: 1.0,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-200 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Global Pipeline Navigation Header */}
      <Header
        currentStage={currentStage}
        setStage={(stage) => setCurrentStage(stage)}
        onReset={handleResetPipeline}
        runs={runs}
        currentRunId={runId}
        onLoadRun={handleLoadRun}
        isLoadingRun={isLoadingRun}
      />

      {/* Pipeline Stage Content Views */}
      <main className="flex-1 pb-16">
        {currentStage === 1 && (
          <Stage1NotesInput
            data={stage1Data}
            updateData={(fields) => setStage1Data((prev) => ({ ...prev, ...fields }))}
            onNextStage={() => setCurrentStage(2)}
            runId={runId}
            onCreateRun={handleCreateRun}
            onPresetSelected={clearGeneratedStages}
          />
        )}

        {currentStage === 2 && (
          <Stage2Storyline
            stage1Data={stage1Data}
            data={stage2Data}
            updateData={(fields) => setStage2Data((prev) => ({ ...prev, ...fields }))}
            onPrevStage={() => setCurrentStage(1)}
            onNextStage={() => setCurrentStage(3)}
            runId={runId}
          />
        )}

        {currentStage === 3 && (
          <Stage3SceneScript
            stage2Data={stage2Data}
            data={stage3Data}
            updateData={(fields) => setStage3Data((prev) => ({ ...prev, ...fields }))}
            onPrevStage={() => setCurrentStage(2)}
            onNextStage={() => setCurrentStage(4)}
            runId={runId}
          />
        )}

        {currentStage === 4 && (
          <Stage4AssetsVoiceover
            stage3Data={stage3Data}
            data={stage4Data}
            updateData={(fields) => setStage4Data((prev) => ({ ...prev, ...fields }))}
            onPrevStage={() => setCurrentStage(3)}
            onNextStage={() => setCurrentStage(5)}
            runId={runId}
          />
        )}

        {currentStage === 5 && (
          <Stage5SceneImages
            stage1Data={stage1Data}
            stage3Data={stage3Data}
            data={stage5Data}
            updateData={(fields) => setStage5Data((prev) => ({ ...prev, ...fields }))}
            onPrevStage={() => setCurrentStage(4)}
            onNextStage={() => setCurrentStage(6)}
            runId={runId}
          />
        )}

        {currentStage === 6 && (
          <Stage6VideoStudio
            stage1Data={stage1Data}
            stage3Data={stage3Data}
            stage4Data={stage4Data}
            stage5Data={stage5Data}
            data={stage6Data}
            updateData={(fields) => setStage6Data((prev) => ({ ...prev, ...fields }))}
            onPrevStage={() => setCurrentStage(5)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0F1116] py-5 text-center text-xs text-slate-500">
        <p>REANIMATE • 6-Stage Educational Video Synthesis Pipeline</p>
      </footer>
    </div>
  );
}
