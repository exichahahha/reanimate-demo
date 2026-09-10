import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_ROOT = path.join(process.cwd(), 'sample_output', 'run_1788705472717_bybmev');
const readStage = (stage: number) => JSON.parse(fs.readFileSync(path.join(SAMPLE_ROOT, `stage${stage}`, 'data.json'), 'utf8'));

function buildSample() {
  const stage1: any = readStage(1), stage2: any = readStage(2), stage3: any = readStage(3), stage4: any = readStage(4), stage5: any = readStage(5), stage6: any = readStage(6);
  const asset = (stage: number, name: string) => `/run-assets/run_1788705472717_bybmev/stage${stage}/${encodeURIComponent(name)}`;
  const voiceoverAssets = Object.fromEntries(Object.entries(stage4.voiceoverAssets || {}).map(([id, value]: [string, any]) => [id, { ...value, audioDataUrl: value.sourceFileName ? asset(4, value.sourceFileName) : value.audioDataUrl, isGenerating: false }]));
  const sceneImages = Object.fromEntries((stage3.scenes || []).map((scene: any, index: number) => [scene.id || `scene-${index + 1}`, { sceneId: scene.id || `scene-${index + 1}`, prompt: scene.imagePrompt || scene.visualDescription || '', aspectRatio: stage5.globalAspectRatio || '16:9', imageUrl: asset(5, `scene ${index + 1}.jpg`), modelUsed: 'local-file', isGenerating: false }]));
  return { stage1: { ...stage1, presetId: 'chemical-bonding' }, stage2, stage3, stage4: { ...stage4, voiceoverAssets }, stage5: { ...stage5, sceneImages }, stage6 };
}

export default function handler(_req: any, res: any) {
  try { res.status(200).json(buildSample()); }
  catch (error: any) { res.status(500).json({ error: error.message || 'Unable to load Chemical Bonding demo sample.' }); }
}