import {
  SceneVideoAsset,
  Stage3Data,
  Stage4Data,
  Stage5Data,
  TimelineComposition,
  TimelineSceneClip,
} from '../types';

export const clampTime = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function narrationDuration(scene: TimelineSceneClip) {
  const sourceDuration = scene.narration.sourceDurationSec ?? scene.durationSec;
  return Math.max(0, sourceDuration - scene.narration.trimStartSec - scene.narration.trimEndSec);
}

export function compositionDuration(composition?: TimelineComposition) {
  return composition?.scenes.reduce((total, scene) => total + Math.max(0.1, scene.durationSec), 0) || 0;
}

export function sceneOffsets(composition: TimelineComposition) {
  let startSec = 0;
  return composition.scenes.map((scene) => {
    const item = { scene, startSec, endSec: startSec + scene.durationSec };
    startSec = item.endSec;
    return item;
  });
}

export function findSceneAtTime(composition: TimelineComposition, timeSec: number) {
  const offsets = sceneOffsets(composition);
  const total = compositionDuration(composition);
  const safeTime = clampTime(timeSec, 0, Math.max(0, total - 0.001));
  return offsets.find((item) => safeTime >= item.startSec && safeTime < item.endSec) || offsets[offsets.length - 1];
}

export function narrationOverlaps(scene: TimelineSceneClip) {
  return scene.narration.startOffsetSec + narrationDuration(scene) > scene.durationSec + 0.01;
}

export function reorderScenes(composition: TimelineComposition, draggedId: string, targetId: string): TimelineComposition {
  if (draggedId === targetId) return composition;
  const scenes = [...composition.scenes];
  const from = scenes.findIndex((scene) => scene.id === draggedId);
  const to = scenes.findIndex((scene) => scene.id === targetId);
  if (from < 0 || to < 0) return composition;
  const [moved] = scenes.splice(from, 1);
  scenes.splice(to, 0, moved);
  return { ...composition, scenes };
}

export function buildInitialComposition(
  stage3: Stage3Data,
  stage4: Stage4Data,
  stage5: Stage5Data,
  sceneVideos: Record<string, SceneVideoAsset> = {},
): TimelineComposition {
  return {
    version: 1,
    aspectRatio: stage5.globalAspectRatio === '9:16' ? '9:16' : '16:9',
    scenes: stage3.scenes.map((scene) => {
      const videoUrl = sceneVideos[scene.id]?.videoUrl;
      const imageUrl = stage5.sceneImages[scene.id]?.imageUrl;
      const durationSec = Math.max(1, scene.durationSec || 10);
      return {
        id: `timeline-${scene.id}`,
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        title: scene.sceneTitle,
        durationSec,
        trimStartSec: 0,
        trimEndSec: 0,
        mediaType: videoUrl ? 'video' : 'image',
        videoUrl,
        imageUrl,
        narration: {
          id: `narration-${scene.id}`,
          sceneId: scene.id,
          sourceUrl: stage4.voiceoverAssets[scene.id]?.audioDataUrl,
          text: scene.dialogueNarrative,
          startOffsetSec: 0,
          trimStartSec: 0,
          trimEndSec: 0,
        },
        subtitle: {
          id: `subtitle-${scene.id}`,
          sceneId: scene.id,
          text: scene.dialogueNarrative,
          startOffsetSec: 0,
          endOffsetSec: durationSec,
        },
        subtitles: [{
          id: `subtitle-${scene.id}-1`,
          sceneId: scene.id,
          text: scene.dialogueNarrative,
          startOffsetSec: 0,
          endOffsetSec: durationSec,
        }],
      } satisfies TimelineSceneClip;
    }),
    backgroundAudio: stage4.bgMusicDataUrl ? {
      sourceUrl: stage4.bgMusicDataUrl,
      title: stage4.bgMusicTitle || stage3.globalMusicGenre || 'Background music',
      volume: stage4.bgMusicVolume,
    } : undefined,
  };
}
