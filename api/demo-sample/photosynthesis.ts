import fs from "node:fs";
import path from "node:path";

const PHOTOSYNTHESIS_SAMPLE_ROOT = path.join(
  process.cwd(),
  "sample_output",
  "photosynthesis",
);

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return {};

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildPhotosynthesisSampleStages() {
  const readStage = (stage: number) =>
    readJsonIfExists(
      path.join(PHOTOSYNTHESIS_SAMPLE_ROOT, `stage${stage}`, "data.json"),
    );

  const stage1: any = readStage(1);
  const stage2: any = readStage(2);
  const stage3: any = readStage(3);
  const stage4: any = readStage(4);
  const stage5: any = readStage(5);
  const stage6: any = readStage(6);

  const voiceoverAssets: Record<string, any> = {};
  const sceneImages: Record<string, any> = {};
  const sceneVideos: Record<string, any> = {};

  for (let scene = 1; scene <= 5; scene++) {
    const sceneId = `scene-${scene}`;

    voiceoverAssets[sceneId] = {
      ...(stage4?.voiceoverAssets?.[sceneId] || {}),
      sceneId,
      audioDataUrl: `/sample-assets/stage4/asset_voiceoverAssets_scene-${scene}_audioDataUrl.mp3`,
      isGenerating: false,
    };

    sceneImages[sceneId] = {
      ...(stage5?.sceneImages?.[sceneId] || {}),
      sceneId,
      imageUrl: `/sample-assets/stage5/scene%20${scene}%20img.jpg`,
      isGenerating: false,
      modelUsed: "demo",
    };

    sceneVideos[sceneId] = {
      ...(stage6?.sceneVideos?.[sceneId] || {}),
      sceneId,
      videoUrl: `/sample-assets/stage6/scene%20${scene}%20vid.mp4`,
      isGenerating: false,
      modelUsed: "demo",
      error: undefined,
    };
  }

  return {
    stage1: { ...stage1, presetId: "photosynthesis", selectedModel: "demo" },
    stage2: { ...stage2, selectedModel: "demo" },
    stage3: { ...stage3, selectedModel: "demo" },
    stage4: { ...stage4, selectedModel: "demo", voiceoverAssets },
    stage5: { ...stage5, selectedModel: "demo", sceneImages },
    stage6: { ...stage6, sceneVideos },
  };
}

export default function handler(_req: any, res: any) {
  try {
    res.status(200).json(buildPhotosynthesisSampleStages());
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Unable to load Photosynthesis demo sample.",
    });
  }
}