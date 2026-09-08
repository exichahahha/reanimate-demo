import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialComposition, compositionDuration, narrationOverlaps, reorderScenes } from './composition';

const stage3: any = { globalMusicGenre: 'Lo-fi', scenes: [
  { id: 'scene-1', sceneNumber: 1, sceneTitle: 'One', durationSec: 5, dialogueNarrative: 'First' },
  { id: 'scene-2', sceneNumber: 2, sceneTitle: 'Two', durationSec: 7, dialogueNarrative: 'Second' },
] };
const stage4: any = { voiceoverAssets: { 'scene-1': { audioDataUrl: 'audio-1' } }, bgMusicVolume: .3 };
const stage5: any = { globalAspectRatio: '16:9', sceneImages: { 'scene-1': { imageUrl: 'image-1' }, 'scene-2': { imageUrl: 'image-2' } } };

test('builds ordered video-first composition with image fallback', () => {
  const composition = buildInitialComposition(stage3, stage4, stage5, { 'scene-1': { sceneId: 'scene-1', prompt: '', videoUrl: 'video-1' } });
  assert.equal(composition.scenes[0].mediaType, 'video');
  assert.equal(composition.scenes[1].mediaType, 'image');
  assert.equal(composition.scenes[0].narration.sourceUrl, 'audio-1');
  assert.equal(compositionDuration(composition), 12);
});

test('reordering keeps linked narration and subtitle with the scene', () => {
  const composition = buildInitialComposition(stage3, stage4, stage5);
  const reordered = reorderScenes(composition, 'timeline-scene-2', 'timeline-scene-1');
  assert.equal(reordered.scenes[0].sceneId, 'scene-2');
  assert.equal(reordered.scenes[0].subtitle.text, 'Second');
});

test('detects manually-created narration overlap', () => {
  const composition = buildInitialComposition(stage3, stage4, stage5);
  const scene = { ...composition.scenes[0], narration: { ...composition.scenes[0].narration, sourceDurationSec: 7 } };
  assert.equal(narrationOverlaps(scene), true);
});
