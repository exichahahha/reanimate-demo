import { DemoOutputStage, DemoSampleOutput, Stage1Data, Stage2Data, Stage3Data, Stage4Data, Stage5Data, Stage6Data, ParsedNoteSummary, PresetSampleNote, SceneImageAsset, SceneVideoAsset, VoiceoverAsset } from '../types';
import { SAMPLE_NOTES } from './sampleNotes';
import { generateSceneSvgDataUrl } from '../utils/svgCanvasGenerator';

export const DEMO_STAGE1_OUTPUT: ParsedNoteSummary = {
  summary: 'Photosynthesis is the process green plants use to convert sunlight into chemical energy stored in glucose. Chlorophyll absorbs light in chloroplasts, powering the light-dependent reactions that split water and produce ATP and NADPH. The Calvin cycle then uses that energy to fix carbon dioxide into glucose. Oxygen is released as a byproduct, making photosynthesis essential for aerobic life and the foundation of food webs.',
  keyConcepts: ['Sunlight and chlorophyll', 'Light-dependent reactions', 'Calvin cycle', 'Glucose and oxygen'],
  suggestedTitles: ['The Plant Power Plant', 'How Leaves Turn Light into Food', 'Photosynthesis: Nature\'s Solar Engine'],
  difficultyLevel: 'Beginner',
  coreTakeaway: 'Plants transform sunlight, water, and carbon dioxide into the energy and oxygen that support life.',
};

export const DEMO_STAGE2_DATA: Stage2Data = {
  selectedModel: 'demo',
  narrativeTone: 'Enthusiastic & Friendly',
  totalEstimatedDuration: 60,
  chapters: [
    { id: 'demo-chap-1', chapterNumber: 1, title: 'Meet Captain Chloroplast', conceptFocus: 'Chloroplast & Chlorophyll', narrativeHook: 'Inside every green leaf, Captain Chloroplast captures sunlight and starts the process of making food.', visualAnimationCue: 'Zoom into a glowing chloroplast as red and blue photons arrive.', durationPercent: 20 },
    { id: 'demo-chap-2', chapterNumber: 2, title: 'The Water-Splitting Zap', conceptFocus: 'Light-Dependent Reactions & Photolysis of Water', narrativeHook: 'Light powers a spectacular reaction that splits water and releases oxygen into the air.', visualAnimationCue: 'Animate water splitting into oxygen, electrons, and hydrogen ions.', durationPercent: 20 },
    { id: 'demo-chap-3', chapterNumber: 3, title: 'Supercharging the Batteries', conceptFocus: 'ATP & NADPH', narrativeHook: 'The captured light energy is stored in two molecular batteries: ATP and NADPH.', visualAnimationCue: 'Show ATP and NADPH charging with bright energy pulses.', durationPercent: 20 },
    { id: 'demo-chap-4', chapterNumber: 4, title: 'The Calvin Sugar Factory', conceptFocus: 'Calvin Cycle (Stroma) & Glucose Synthesis', narrativeHook: 'Inside the chloroplast, the Calvin cycle uses those charged batteries to build glucose.', visualAnimationCue: 'Show carbon dioxide molecules joining a circular pathway and forming a glucose icon.', durationPercent: 25 },
    { id: 'demo-chap-5', chapterNumber: 5, title: 'Powering the World', conceptFocus: 'Energetic Foundation & Oxygen Balance', narrativeHook: 'Photosynthesis powers plant growth and releases the oxygen that supports life across our planet.', visualAnimationCue: 'Reveal a thriving ecosystem connected by oxygen and energy flow.', durationPercent: 15 },
  ],
};

export const DEMO_STAGE3_DATA: Stage3Data = {
  selectedModel: 'demo',
  globalMusicGenre: 'Uplifting Lo-Fi Beats',
  scenes: DEMO_STAGE2_DATA.chapters.map((chapter, index) => ({
    id: `demo-scene-${index + 1}`,
    sceneNumber: index + 1,
    durationSec: [12, 12, 12, 15, 9][index],
    sceneTitle: chapter.title,
    visualDescription: chapter.visualAnimationCue,
    dialogueNarrative: chapter.narrativeHook,
    cameraAngle: ['Medium Push-in', 'Close-up Focus', 'Split Screen Comparison', 'Wide Shot (Pan)', 'Dynamic 360 Rotation'][index],
    lightingMood: 'Warm sunlight with emerald highlights',
    bgMusicPrompt: 'Bright educational lo-fi pulse with gentle synth accents',
    motionGraphicType: 'Diagram Reveal',
    imagePrompt: chapter.visualAnimationCue,
    videoPrompt: `Using the Stage 5 scene keyframe image as the visual reference: animate ${chapter.conceptFocus.toLowerCase()} with a gentle educational camera move.`,
  })),
};

export const createDemoStage1Data = (base: Stage1Data): Stage1Data => ({
  ...base,
  selectedModel: 'demo',
  parsedOutput: DEMO_STAGE1_OUTPUT,
});

export const createDemoStage4Data = (base: Stage4Data): Stage4Data => ({
  ...base,
  selectedModel: 'demo',
  voiceoverAssets: {},
});

export const createDemoStage5Data = (base: Stage5Data): Stage5Data => ({
  ...base,
  selectedModel: 'demo',
  sceneImages: {},
});

export const createDemoStage6Data = (base: Stage6Data): Stage6Data => ({
  ...base,
  isPlaying: false,
  currentTime: 0,
  isExporting: false,
  exportProgress: 0,
});

const DEMO_PRESET_DETAILS: Record<string, {
  summary: string;
  keyConcepts: string[];
  suggestedTitles: string[];
  coreTakeaway: string;
  chapters: Array<{
    title: string;
    conceptFocus: string;
    narrativeHook: string;
    visualAnimationCue: string;
    durationPercent: number;
  }>;
  musicGenre: string;
}> = {
  photosynthesis: {
    summary: DEMO_STAGE1_OUTPUT.summary,
    keyConcepts: DEMO_STAGE1_OUTPUT.keyConcepts,
    suggestedTitles: DEMO_STAGE1_OUTPUT.suggestedTitles,
    coreTakeaway: DEMO_STAGE1_OUTPUT.coreTakeaway,
    chapters: DEMO_STAGE2_DATA.chapters.map(({ title, conceptFocus, narrativeHook, visualAnimationCue, durationPercent }) => ({
      title,
      conceptFocus,
      narrativeHook,
      visualAnimationCue,
      durationPercent,
    })),
    musicGenre: DEMO_STAGE3_DATA.globalMusicGenre,
  },
  'doppler-effect-sound-waves': {
    summary: 'The Doppler effect is the change in observed sound frequency caused by motion between a source and an observer. As a sound source approaches, wavefronts compress and pitch rises. As it moves away, wavefronts spread out and pitch falls.',
    keyConcepts: ['Sound waves', 'Frequency and pitch', 'Moving source', 'Compressed wavefronts', 'Stretched wavefronts'],
    suggestedTitles: ['Why Sirens Change Pitch', 'The Sound Wave Chase', 'Doppler Effect: When Motion Changes What You Hear'],
    coreTakeaway: 'Motion changes the spacing of sound waves reaching an observer, which changes the pitch that is heard.',
    chapters: [
      { title: 'A Siren Enters the Scene', conceptFocus: 'Sound waves and observers', narrativeHook: 'A city ambulance races toward us, and the siren seems to climb in pitch.', visualAnimationCue: 'Show circular sound waves radiating from a moving ambulance through a city street.', durationPercent: 20 },
      { title: 'Waves Get Compressed', conceptFocus: 'Approaching source', narrativeHook: 'In front of the moving source, each new wavefront is released closer to the last one.', visualAnimationCue: 'Animate tightly packed wavefronts in front of the ambulance with a high-pitch meter rising.', durationPercent: 25 },
      { title: 'Waves Stretch Behind', conceptFocus: 'Receding source', narrativeHook: 'Behind the source, the wavefronts spread apart, so the pitch drops.', visualAnimationCue: 'Show wide-spaced waves trailing behind the vehicle with a low-pitch meter falling.', durationPercent: 20 },
      { title: 'Frequency Becomes Pitch', conceptFocus: 'Frequency and wavelength', narrativeHook: 'More wave cycles per second sound higher, while fewer cycles per second sound lower.', visualAnimationCue: 'Compare short wavelength high-frequency waves with long wavelength low-frequency waves.', durationPercent: 20 },
      { title: 'Everyday Doppler Clues', conceptFocus: 'Real-world examples', narrativeHook: 'Race cars, sirens, bats, and dolphins all reveal motion through frequency shifts.', visualAnimationCue: 'Reveal quick examples of a race car, siren, bat echo, and dolphin sonar.', durationPercent: 15 },
    ],
    musicGenre: 'High-energy rhythmic electronic beats',
  },
  'chemical-bonding': {
    summary: 'Chemical bonding is the force that holds atoms together in compounds. Atoms bond through their valence electrons by transferring electrons in ionic bonds, sharing electrons in covalent bonds, or pooling electrons in metallic bonds.',
    keyConcepts: ['Valence electrons', 'Ionic bonding', 'Covalent bonding', 'Metallic bonding', 'Bond properties'],
    suggestedTitles: ['Why Atoms Stick Together', 'Electron Deals: Ionic, Covalent, Metallic', 'Chemical Bonding: Building Matter'],
    coreTakeaway: 'Atoms form bonds by transferring, sharing, or pooling electrons to reach more stable arrangements.',
    chapters: [
      { title: 'The Outer Shell Problem', conceptFocus: 'Valence electrons', narrativeHook: 'Atoms are most reactive through their outer electrons, where bonding begins.', visualAnimationCue: 'Show atoms with highlighted outer electron shells searching for stability.', durationPercent: 20 },
      { title: 'The Electron Transfer', conceptFocus: 'Ionic bonding', narrativeHook: 'One atom gives away an electron, another receives it, and opposite charges lock together.', visualAnimationCue: 'Animate sodium transferring an electron to chlorine, forming Na+ and Cl- ions.', durationPercent: 22 },
      { title: 'The Shared Electron Team', conceptFocus: 'Covalent bonding', narrativeHook: 'Some atoms become stable by sharing electrons instead of transferring them.', visualAnimationCue: 'Show two hydrogen atoms sharing electrons with oxygen to build a water molecule.', durationPercent: 22 },
      { title: 'The Metal Electron Sea', conceptFocus: 'Metallic bonding', narrativeHook: 'In metals, electrons move freely through a lattice of positive atoms.', visualAnimationCue: 'Animate a metal lattice with free electrons flowing like a glowing current.', durationPercent: 20 },
      { title: 'Properties Reveal the Bond', conceptFocus: 'Bond properties', narrativeHook: 'Melting point, conductivity, and shape can hint at the type of bond holding matter together.', visualAnimationCue: 'Compare salt crystals, water droplets, and a bendable copper wire.', durationPercent: 16 },
    ],
    musicGenre: 'Playful Chiptune',
  },
  'properties-of-waves': {
    summary: 'Waves transfer energy from one place to another without permanently moving matter. Their properties include amplitude, wavelength, frequency, and speed, and their behavior changes through reflection, refraction, diffraction, and interference.',
    keyConcepts: ['Amplitude', 'Wavelength', 'Frequency', 'Wave speed', 'Transverse waves', 'Longitudinal waves', 'Wave behaviors'],
    suggestedTitles: ['The Wave Toolkit', 'Amplitude, Frequency, and Friends', 'Properties of Waves: How Energy Travels'],
    coreTakeaway: 'Waves transfer energy, and their behavior can be described using measurable properties and interactions.',
    chapters: [
      { title: 'Energy Starts Traveling', conceptFocus: 'Wave definition', narrativeHook: 'A disturbance moves energy through space while the material mostly wiggles in place.', visualAnimationCue: 'Show a pulse moving along a rope while markers on the rope oscillate.', durationPercent: 18 },
      { title: 'Amplitude Shows Energy', conceptFocus: 'Amplitude', narrativeHook: 'Taller waves carry more energy, like louder sound or stronger motion.', visualAnimationCue: 'Compare small and large wave heights with an energy gauge.', durationPercent: 18 },
      { title: 'Wavelength and Frequency', conceptFocus: 'Wavelength and frequency', narrativeHook: 'Shorter wavelengths usually mean more cycles per second, while longer wavelengths mean fewer.', visualAnimationCue: 'Animate tightly spaced and widely spaced waves passing a sensor.', durationPercent: 24 },
      { title: 'Speed Connects the Numbers', conceptFocus: 'Wave speed equation', narrativeHook: 'Wave speed links frequency and wavelength through a simple relationship.', visualAnimationCue: 'Display speed = frequency x wavelength beside a moving wave ruler.', durationPercent: 20 },
      { title: 'Waves Interact with the World', conceptFocus: 'Reflection, refraction, diffraction, interference', narrativeHook: 'Waves can bounce, bend, spread, and combine when they meet surfaces, gaps, or other waves.', visualAnimationCue: 'Show four mini experiments: mirror reflection, bending through water, spreading through a slit, and wave overlap.', durationPercent: 20 },
    ],
    musicGenre: 'Ambient Scientific Drone',
  },
};

const findPreset = (presetId: string) => SAMPLE_NOTES.find((sample) => sample.id === presetId) || SAMPLE_NOTES[0];

export function buildPresetDemoProject(presetId: string) {
  const preset = findPreset(presetId);
  const details = DEMO_PRESET_DETAILS[preset.id] || DEMO_PRESET_DETAILS.photosynthesis;
  const parsedOutput: ParsedNoteSummary = {
    summary: details.summary,
    keyConcepts: details.keyConcepts,
    suggestedTitles: details.suggestedTitles,
    difficultyLevel: 'Beginner',
    coreTakeaway: details.coreTakeaway,
  };

  const stage1: Stage1Data = {
    presetId: preset.id,
    noteContent: preset.content,
    themeIdea: preset.suggestedTheme,
    targetAudience: 'Middle/High School (Ages 12-17)',
    visualStyle: '3D Pixar Animation',
    targetDuration: 60,
    selectedModel: 'demo',
    parsedOutput,
  };

  const stage2: Stage2Data = {
    selectedModel: 'demo',
    narrativeTone: 'Enthusiastic & Friendly',
    totalEstimatedDuration: 60,
    chapters: details.chapters.map((chapter, index) => ({
      id: `${preset.id}-chap-${index + 1}`,
      chapterNumber: index + 1,
      ...chapter,
    })),
  };

  const stage3: Stage3Data = {
    selectedModel: 'demo',
    globalMusicGenre: details.musicGenre,
    scenes: stage2.chapters.map((chapter, index) => ({
      id: `${preset.id}-scene-${index + 1}`,
      sceneNumber: index + 1,
      durationSec: [12, 12, 12, 15, 9][index] || 10,
      sceneTitle: chapter.title,
      visualDescription: chapter.visualAnimationCue,
      dialogueNarrative: chapter.narrativeHook,
      cameraAngle: ['Medium Push-in', 'Close-up Focus', 'Split Screen Comparison', 'Wide Shot (Pan)', 'Dynamic 360 Rotation'][index] || 'Medium Push-in',
      lightingMood: 'Warm cinematic classroom lighting with clear subject focus',
      bgMusicPrompt: details.musicGenre,
      motionGraphicType: 'Diagram Reveal',
      imagePrompt: chapter.visualAnimationCue,
      videoPrompt: `Using the Stage 5 scene keyframe image as the visual reference: animate ${chapter.conceptFocus.toLowerCase()} with a gentle educational camera move.`,
    })),
  };

  const stage4: Stage4Data = {
    selectedModel: 'demo',
    selectedVoice: 'Kore',
    voiceoverAssets: {},
    bgMusicVolume: 0.3,
  };

  const sceneImages = stage3.scenes.reduce<Record<string, SceneImageAsset>>((items, scene) => {
    items[scene.id] = {
      sceneId: scene.id,
      prompt: scene.imagePrompt || scene.visualDescription,
      aspectRatio: '16:9',
      imageUrl: generateSceneSvgDataUrl(scene.sceneTitle, stage1.visualStyle, scene.sceneNumber, scene.visualDescription, '16:9'),
      isGenerating: false,
      modelUsed: 'demo',
    };
    return items;
  }, {});

  const stage5: Stage5Data = {
    selectedModel: 'demo',
    sceneImages,
    globalAspectRatio: '16:9',
  };

  const sceneVideos = stage3.scenes.reduce<Record<string, SceneVideoAsset>>((items, scene) => {
    items[scene.id] = {
      sceneId: scene.id,
      prompt: scene.videoPrompt || scene.visualDescription,
      isGenerating: false,
      modelUsed: 'demo',
    };
    return items;
  }, {});

  const stage6: Stage6Data = {
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    isExporting: false,
    exportProgress: 0,
    captionStyle: 'Bold Pop-up',
    showMotionGraphics: true,
    playbackSpeed: 1,
    sceneVideos,
  };

  return { preset, stage1, stage2, stage3, stage4, stage5, stage6 };
}

export const isDemoPresetId = (presetId?: string) => !!presetId && SAMPLE_NOTES.some((sample) => sample.id === presetId);

export const demoStage1OutputForPreset = (presetId?: string) => buildPresetDemoProject(presetId || SAMPLE_NOTES[0].id).stage1.parsedOutput!;

type DemoStageOutputMap = {
  stage1: DemoSampleOutput<ParsedNoteSummary>;
  stage2: DemoSampleOutput<Stage2Data>;
  stage3: DemoSampleOutput<Stage3Data>;
  stage4: DemoSampleOutput<Stage4Data>;
  stage5: DemoSampleOutput<Stage5Data>;
  stage6: DemoSampleOutput<Partial<Stage6Data>>;
};

const photosynthesisVoiceovers = DEMO_STAGE3_DATA.scenes.reduce<Record<string, VoiceoverAsset>>((assets, scene) => {
  assets[scene.id] = {
    sceneId: scene.id,
    voiceName: 'Kore',
    speed: 1,
    pitch: 1,
    audioDataUrl: `/sample-assets/stage4/asset_voiceoverAssets_scene-${scene.sceneNumber}_audioDataUrl.mp3`,
  };
  return assets;
}, {});

const photosynthesisImages = DEMO_STAGE3_DATA.scenes.reduce<Record<string, SceneImageAsset>>((assets, scene) => {
  assets[scene.id] = {
    sceneId: scene.id,
    prompt: scene.imagePrompt || scene.visualDescription,
    aspectRatio: '16:9',
    imageUrl: `/sample-assets/stage5/scene%20${scene.sceneNumber}%20img.jpg`,
    modelUsed: 'gemini-flash-text-image',
  };
  return assets;
}, {});

const photosynthesisVideos = DEMO_STAGE3_DATA.scenes.reduce<Record<string, SceneVideoAsset>>((assets, scene) => {
  assets[scene.id] = {
    sceneId: scene.id,
    prompt: scene.videoPrompt || scene.visualDescription,
    videoUrl: `/sample-assets/stage6/scene%20${scene.sceneNumber}%20vid.mp4`,
    modelUsed: 'omni-flash',
  };
  return assets;
}, {});

export const DEMO_SAMPLE_OUTPUTS: Record<string, DemoStageOutputMap> = {
  photosynthesis: {
    // Gemini Flash generated the saved notes analysis and learning concepts.
    stage1: { stage: 'stage1', model: 'gemini-flash-text-image', modelLabel: 'Gemini Flash (Text & Image)', estimatedDurationMs: 1600, output: DEMO_STAGE1_OUTPUT },
    // Gemini Flash generated the saved storyline chapters.
    stage2: { stage: 'stage2', model: 'gemini-flash-text-image', modelLabel: 'Gemini Flash (Text & Image)', estimatedDurationMs: 1800, output: { ...DEMO_STAGE2_DATA, selectedModel: 'gemini-flash-text-image' } },
    // Gemini Flash generated the saved production script.
    stage3: { stage: 'stage3', model: 'gemini-flash-text-image', modelLabel: 'Gemini Flash (Text & Image)', estimatedDurationMs: 2000, output: { ...DEMO_STAGE3_DATA, selectedModel: 'gemini-flash-text-image' } },
    // ElevenLabs TTS generated the saved narration audio assets.
    stage4: { stage: 'stage4', model: 'elevenlabs-tts', modelLabel: 'ElevenLabs TTS', estimatedDurationMs: 2400, output: { selectedModel: 'elevenlabs-tts', selectedVoice: 'Kore', voiceoverAssets: photosynthesisVoiceovers, bgMusicVolume: 0.3 } },
    // Gemini Flash generated the saved scene keyframes.
    stage5: { stage: 'stage5', model: 'gemini-flash-text-image', modelLabel: 'Gemini Flash (Text & Image)', estimatedDurationMs: 2200, output: { selectedModel: 'gemini-flash-text-image', sceneImages: photosynthesisImages, globalAspectRatio: '16:9' } },
    // Omni Flash generated the saved multimodal video clips.
    stage6: { stage: 'stage6', model: 'omni-flash', modelLabel: 'Omni Flash', estimatedDurationMs: 2600, output: { sceneVideos: photosynthesisVideos } },
  },
};

export function getDemoSampleOutput<T>(presetId: string | undefined, stage: DemoOutputStage, selectedModel: string): DemoSampleOutput<T> | undefined {
  const sample = DEMO_SAMPLE_OUTPUTS[presetId || 'photosynthesis']?.[stage] as DemoSampleOutput<T> | undefined;
  if (sample?.model === selectedModel) return sample;

  // ChatGPT is a demo-only text-model option for the saved Photosynthesis project.
  // It reuses the curated sample output through Stage 3 while preserving the chosen model in the UI.
  if (sample && selectedModel === 'chatgpt' && ['stage1', 'stage2', 'stage3'].includes(stage)) {
    return { ...sample, model: 'chatgpt', modelLabel: 'ChatGPT' };
  }

  return undefined;
}

export const waitForDemoOutput = (sample: DemoSampleOutput<unknown>) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, sample.estimatedDurationMs);
});

type LocalPhotosynthesisSample = {
  stage1?: Stage1Data;
  stage2?: Stage2Data;
  stage3?: Stage3Data;
  stage4?: Stage4Data;
  stage5?: Stage5Data;
  stage6?: Stage6Data;
};

// The local endpoint reads sample_output/Photosynthesis and Solar Energy; it never calls an AI service.
export async function loadDemoSampleOutput<T>(presetId: string | undefined, stage: DemoOutputStage, selectedModel: string): Promise<DemoSampleOutput<T> | undefined> {
  const sample = getDemoSampleOutput<T>(presetId, stage, selectedModel);
  if (!sample) return undefined;

  await waitForDemoOutput(sample);
  if ((presetId || 'photosynthesis') !== 'photosynthesis') return sample;

  const response = await fetch('/api/demo-sample/photosynthesis');
  if (!response.ok) throw new Error('Unable to load the saved Photosynthesis sample output.');
  const project = await response.json() as LocalPhotosynthesisSample;
  const output = stage === 'stage1' ? project.stage1?.parsedOutput
    : stage === 'stage2' ? project.stage2 && { ...project.stage2, selectedModel }
    : stage === 'stage3' ? project.stage3 && { ...project.stage3, selectedModel }
    : stage === 'stage4' ? project.stage4 && { ...project.stage4, selectedModel }
    : stage === 'stage5' ? project.stage5 && { ...project.stage5, selectedModel }
    : project.stage6 && { ...project.stage6, isPlaying: false, currentTime: 0, isExporting: false, exportProgress: 0 };

  if (!output) throw new Error(`The saved Photosynthesis ${stage} output is unavailable.`);
  return { ...sample, output: output as T };
}
