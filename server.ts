import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";
import dotenv from "dotenv";
import ffmpegPath from "ffmpeg-static";
import { GoogleGenAI, Type } from "@google/genai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createServer as createViteServer } from "vite";
import { DEMO_STAGE1_OUTPUT, DEMO_STAGE2_DATA, DEMO_STAGE3_DATA } from "./src/data/demoRun";
import { buildGeminiNarrationPrompt } from "./src/utils/ttsPrompt";

const SAMPLE_OUTPUT_ROOT = path.resolve(process.cwd(), "sample_output");
const PHOTOSYNTHESIS_SAMPLE_ID = "sample_photosynthesis_solar_energy";
const PHOTOSYNTHESIS_SAMPLE_NAME = "Photosynthesis and Solar Energy";
const PHOTOSYNTHESIS_SAMPLE_ROOT = path.join(SAMPLE_OUTPUT_ROOT, PHOTOSYNTHESIS_SAMPLE_NAME);

function safeRunId(runId: string) {
  if (runId === PHOTOSYNTHESIS_SAMPLE_ID) return runId;
  if (!/^run_[A-Za-z0-9_-]+$/.test(runId)) throw new Error("Invalid run id");
  return runId;
}

function runPath(runId: string) {
  const safeId = safeRunId(runId);
  if (safeId === PHOTOSYNTHESIS_SAMPLE_ID) return PHOTOSYNTHESIS_SAMPLE_ROOT;
  const resolved = path.resolve(SAMPLE_OUTPUT_ROOT, safeId);
  if (path.dirname(resolved) !== SAMPLE_OUTPUT_ROOT) throw new Error("Invalid run path");
  return resolved;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function extensionForMimeType(mimeType: string) {
  const knownExtensions: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "image/jpeg": "jpg",
    "video/webm": "webm",
  };
  return knownExtensions[mimeType.toLowerCase()] || mimeType.split("/")[1] || "bin";
}

function saveDataUrls(value: unknown, stagePath: string, prefix = "asset"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "string" && child.startsWith("data:")) {
      const match = child.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const extension = extensionForMimeType(match[1]);
        fs.writeFileSync(path.join(stagePath, `${prefix}_${key}.${extension}`), Buffer.from(match[2], "base64"));
      }
    } else if (child && typeof child === "object") {
      saveDataUrls(child, stagePath, `${prefix}_${key}`);
    }
  }
}

function saveStage(runId: string, stageName: string, payload: { input?: unknown; output?: unknown; data?: unknown }) {
  if (!/^stage[1-6]$/.test(stageName)) throw new Error("Invalid stage");
  const stagePath = path.join(runPath(runId), stageName);
  fs.mkdirSync(stagePath, { recursive: true });
  if (payload.input !== undefined) writeJson(path.join(stagePath, "input.json"), payload.input);
  if (payload.output !== undefined) writeJson(path.join(stagePath, "output.json"), payload.output);
  if (payload.data !== undefined) {
    writeJson(path.join(stagePath, "data.json"), payload.data);
    saveDataUrls(payload.data, stagePath);
  }
  const manifestPath = path.join(runPath(runId), "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { id: runId, stages: [] };
  manifest.updatedAt = new Date().toISOString();
  if (!manifest.stages.includes(stageName)) manifest.stages.push(stageName);
  writeJson(manifestPath, manifest);
}

function readJsonIfExists(filePath: string) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : undefined;
}

function buildPhotosynthesisSampleStages() {
  const readStage = (stage: number) => readJsonIfExists(path.join(PHOTOSYNTHESIS_SAMPLE_ROOT, `stage${stage}`, "data.json"));
  const stage1 = readStage(1) as any;
  const stage2 = readStage(2) as any;
  const stage3 = readStage(3) as any;
  const stage4 = readStage(4) as any;
  const stage5 = readStage(5) as any;
  const stage6 = readStage(6) as any;
  const voiceoverAssets: Record<string, any> = {};
  const sceneImages: Record<string, any> = {};
  const sceneVideos: Record<string, any> = {};

  for (let scene = 1; scene <= 5; scene++) {
    const sceneId = `scene-${scene}`;
    voiceoverAssets[sceneId] = {
      ...(stage4?.voiceoverAssets?.[sceneId] || {}),
      sceneId,
      audioDataUrl: `/sample_output/photosynthesis/stage4/asset_voiceoverAssets_scene-${scene}_audioDataUrl.mp3`,
      isGenerating: false,
    };
    sceneImages[sceneId] = {
      ...(stage5?.sceneImages?.[sceneId] || {}),
      sceneId,
      imageUrl: `/sample_output/photosynthesis/stage5/scene%20${scene}%20img.jpg`,
      isGenerating: false,
      modelUsed: "demo",
    };
    sceneVideos[sceneId] = {
      ...(stage6?.sceneVideos?.[sceneId] || {}),
      sceneId,
      videoUrl: `/sample_output/photosynthesis/stage6/scene%20${scene}%20vid.mp4`,
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

// Load env files from the project root so local dev and AI Studio both work.
const envFiles = [".env", ".env.local"];
for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: envFile === ".env.local" });
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const COMFYUI_URL = (process.env.COMFYUI_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
fs.mkdirSync(SAMPLE_OUTPUT_ROOT, { recursive: true });

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// The bundled Photosynthesis demo assets are served as normal media files so
// the browser can preview them without putting binary data in React state.
app.use("/sample-assets", express.static(PHOTOSYNTHESIS_SAMPLE_ROOT));

app.get("/api/demo-sample/photosynthesis", (_req, res) => {
  try {
    res.json(buildPhotosynthesisSampleStages());
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unable to load Photosynthesis demo sample." });
  }
});

app.post("/api/stage6/convert-to-mp4", express.raw({ type: ["video/webm", "application/octet-stream"], limit: "500mb" }), (req, res) => {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    return res.status(503).json({ error: "The project-local FFmpeg binary is unavailable." });
  }
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "No WebM video was supplied for conversion." });
  }

  const conversionId = `reanimate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputPath = path.join(os.tmpdir(), `${conversionId}.webm`);
  const outputPath = path.join(os.tmpdir(), `${conversionId}.mp4`);
  const cleanup = () => {
    for (const filePath of [inputPath, outputPath]) {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* best-effort temporary-file cleanup */ }
    }
  };

  try {
    fs.writeFileSync(inputPath, req.body);
    const ffmpeg = spawn(ffmpegPath, [
      "-y", "-i", inputPath,
      "-map", "0:v:0", "-map", "0:a?",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k",
      "-movflags", "+faststart",
      outputPath,
    ], { windowsHide: true });
    let ffmpegError = "";
    ffmpeg.stderr.on("data", (chunk) => { ffmpegError = `${ffmpegError}${chunk}`.slice(-8000); });
    ffmpeg.on("error", (error) => {
      cleanup();
      if (!res.headersSent) res.status(500).json({ error: `Unable to start MP4 conversion: ${error.message}` });
    });
    ffmpeg.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(outputPath)) {
        cleanup();
        return res.status(500).json({ error: "MP4 conversion failed.", details: ffmpegError });
      }
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", "attachment; filename=REANIMATE_Edited_Video.mp4");
      res.sendFile(outputPath, (error) => {
        cleanup();
        if (error && !res.headersSent) res.status(500).json({ error: "Unable to send the converted MP4." });
      });
    });
  } catch (error: any) {
    cleanup();
    res.status(500).json({ error: error.message || "Unable to prepare MP4 conversion." });
  }
});

// Helper to instantiate Gemini AI client server-side
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Operating with standard fallback mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function localWorkflowPath(kind: "image" | "video") {
  const configured = kind === "image" ? process.env.COMFYUI_IMAGE_WORKFLOW : process.env.COMFYUI_VIDEO_WORKFLOW;
  return configured ? path.resolve(process.cwd(), configured) : path.resolve(process.cwd(), "local-ai", "workflows", `${kind}.json`);
}

function replaceWorkflowTokens(value: unknown, replacements: Record<string, string>): unknown {
  if (typeof value === "string") {
    const replaced = Object.entries(replacements).reduce((result, [token, replacement]) => result.split(token).join(replacement), value);
    if (/^-?\d+$/.test(replaced)) return Number(replaced);
    if (/^-?\d+\.\d+$/.test(replaced)) return Number(replaced);
    return replaced;
  }
  if (Array.isArray(value)) return value.map((item) => replaceWorkflowTokens(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, replaceWorkflowTokens(child, replacements)]));
  }
  return value;
}

function dimensionsForAspectRatio(aspectRatio: string | undefined) {
  if (aspectRatio === "9:16") return { width: 576, height: 1024 };
  if (aspectRatio === "1:1") return { width: 768, height: 768 };
  return { width: 1024, height: 576 };
}

async function waitForComfyOutput(promptId: string, timeoutMs = 10 * 60 * 1000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    if (response.ok) {
      const history = await response.json() as Record<string, any>;
      const entry = history[promptId];
      if (entry?.outputs) return entry.outputs;
      if (entry?.status?.status_str === "error") throw new Error("ComfyUI workflow failed.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for ComfyUI output.");
}

async function generateWithComfy(kind: "image" | "video", replacements: Record<string, string>) {
  const workflowPath = localWorkflowPath(kind);
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Missing local ${kind} workflow: ${workflowPath}`);
  }
  const workflow = replaceWorkflowTokens(JSON.parse(fs.readFileSync(workflowPath, "utf8")), replacements);
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: `reanimate-${Date.now()}` }),
  });
  if (!response.ok) throw new Error(`ComfyUI is unavailable (${response.status}). Start ComfyUI and try again.`);
  const submitted = await response.json() as { prompt_id?: string; error?: string };
  if (!submitted.prompt_id) throw new Error(submitted.error || "ComfyUI did not accept the workflow.");
  const outputs = await waitForComfyOutput(submitted.prompt_id);
  const media = Object.values(outputs).flatMap((node: any) => [ ...(node.images || []), ...(node.gifs || []), ...(node.videos || []) ]);
  if (!media.length) throw new Error("ComfyUI completed without an image or video output.");
  const item: any = media[0];
  const fileResponse = await fetch(`${COMFYUI_URL}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder || "")}&type=${encodeURIComponent(item.type || "output")}`);
  if (!fileResponse.ok) throw new Error("Unable to download the ComfyUI output.");
  const buffer = Buffer.from(await fileResponse.arrayBuffer());
  const mime = kind === "image" ? (item.filename.toLowerCase().endsWith(".jpg") || item.filename.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png") : (item.filename.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4");
  return { dataUrl: `data:${mime};base64,${buffer.toString("base64")}`, promptId: submitted.prompt_id };
}

// -------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

app.get("/api/local-ai/status", async (_req, res) => {
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`);
    res.json({ available: response.ok, url: COMFYUI_URL });
  } catch {
    res.json({ available: false, url: COMFYUI_URL });
  }
});

app.post("/api/local-ai/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, visualStyle } = req.body;
    const dimensions = dimensionsForAspectRatio(aspectRatio);
    const result = await generateWithComfy("image", {
      "{{prompt}}": `${prompt}. Visual style: ${visualStyle || "clear educational illustration"}.`,
      "{{aspectRatio}}": aspectRatio || "16:9",
      "{{width}}": String(dimensions.width),
      "{{height}}": String(dimensions.height),
      "{{seed}}": String(Math.floor(Math.random() * 2_000_000_000)),
      "{{filename_prefix}}": "reanimate_image",
    });
    res.json({ imageUrl: result.dataUrl, modelUsed: "local-comfyui-image", promptId: result.promptId });
  } catch (error: any) {
    res.status(503).json({ error: error.message || "Local image generation failed." });
  }
});

app.post("/api/local-ai/generate-video", async (req, res) => {
  try {
    const { prompt, durationSec, aspectRatio, imageUrl } = req.body;
    const replacements: Record<string, string> = {
      "{{prompt}}": prompt || "Animate the educational scene with gentle camera movement.",
      "{{durationSec}}": String(Math.min(10, Math.max(2, Number(durationSec) || 8))),
      "{{aspectRatio}}": aspectRatio || "16:9",
      "{{seed}}": String(Math.floor(Math.random() * 2_000_000_000)),
      "{{filename_prefix}}": "reanimate_video",
    };
    // A LoadImage node in the workflow can use this token after ComfyUI receives the keyframe.
    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const form = new FormData();
        form.append("image", new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), "reanimate-keyframe.png");
        form.append("overwrite", "true");
        const upload = await fetch(`${COMFYUI_URL}/upload/image`, { method: "POST", body: form });
        if (upload.ok) {
          const uploaded = await upload.json() as { name?: string; subfolder?: string; type?: string };
          replacements["{{imageFilename}}"] = [uploaded.subfolder, uploaded.name].filter(Boolean).join("/");
        }
      }
    }
    const result = await generateWithComfy("video", replacements);
    res.json({ videoUrl: result.dataUrl, modelUsed: "local-comfyui-video", promptId: result.promptId });
  } catch (error: any) {
    res.status(503).json({ error: error.message || "Local video generation failed." });
  }
});

app.post("/api/runs", (_req, res) => {
  const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  fs.mkdirSync(runPath(id), { recursive: true });
  writeJson(path.join(runPath(id), "manifest.json"), { id, createdAt, updatedAt: createdAt, stages: [] });
  res.json({ id, createdAt, updatedAt: createdAt });
});

app.get("/api/runs", (_req, res) => {
  const runs = fs.readdirSync(SAMPLE_OUTPUT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^run_[A-Za-z0-9_-]+$/.test(entry.name))
    .map((entry) => readJsonIfExists(path.join(SAMPLE_OUTPUT_ROOT, entry.name, "manifest.json")))
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const sampleManifest = readJsonIfExists(path.join(PHOTOSYNTHESIS_SAMPLE_ROOT, "manifest.json")) || {};
  res.json([
    {
      id: PHOTOSYNTHESIS_SAMPLE_ID,
      name: PHOTOSYNTHESIS_SAMPLE_NAME,
      createdAt: sampleManifest.createdAt || "",
      updatedAt: sampleManifest.updatedAt || "",
      readOnly: true,
    },
    ...runs,
  ]);
});

app.get("/api/runs/:runId", (req, res) => {
  try {
    if (req.params.runId === PHOTOSYNTHESIS_SAMPLE_ID) {
      const sampleManifest = readJsonIfExists(path.join(PHOTOSYNTHESIS_SAMPLE_ROOT, "manifest.json")) || {};
      const sample = buildPhotosynthesisSampleStages();
      return res.json({
        ...sampleManifest,
        id: PHOTOSYNTHESIS_SAMPLE_ID,
        name: PHOTOSYNTHESIS_SAMPLE_NAME,
        readOnly: true,
        stages: Object.fromEntries(Object.entries(sample).map(([stageName, data]) => [stageName, { data }])),
      });
    }
    const root = runPath(req.params.runId);
    if (!fs.existsSync(root)) return res.status(404).json({ error: "Run not found" });
    const manifest = readJsonIfExists(path.join(root, "manifest.json")) || { id: req.params.runId };
    const stages: Record<string, unknown> = {};
    for (let stage = 1; stage <= 6; stage++) {
      const stagePath = path.join(root, `stage${stage}`);
      if (fs.existsSync(stagePath)) {
        stages[`stage${stage}`] = {
          input: readJsonIfExists(path.join(stagePath, "input.json")),
          output: readJsonIfExists(path.join(stagePath, "output.json")),
          data: readJsonIfExists(path.join(stagePath, "data.json")),
        };
      }
    }
    res.json({ ...manifest, stages });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/runs/:runId/:stageName", (req, res) => {
  try {
    if (req.params.runId === PHOTOSYNTHESIS_SAMPLE_ID) {
      return res.status(403).json({ error: "Bundled demo samples are read-only" });
    }
    if (!fs.existsSync(runPath(req.params.runId))) return res.status(404).json({ error: "Run not found" });
    saveStage(req.params.runId, req.params.stageName, req.body || {});
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Stage 1: Process and synthesize educational notes
app.post("/api/stage1/process-notes", async (req, res) => {
  try {
    const {
      noteContent,
      noteFileBase64,
      noteFileMime,
      themeIdea,
      targetAudience,
      visualStyle,
      selectedModel
    } = req.body;

    if (selectedModel === "demo") {
      return res.json(DEMO_STAGE1_OUTPUT);
    }

    // ============================================================
    // INTEL OPENVINO PATH
    // This must run BEFORE getGeminiClient(), otherwise a missing
    // Gemini API key would trigger the fallback response first.
    // ============================================================
    if (selectedModel === "intel-openvino-qwen3") {
      console.log("[Intel OpenVINO] Stage 1 selected");

      const promptText = `You are an educational content assistant.

IMPORTANT:
The lecturer's notes below are the ONLY source of truth.
You MUST analyze THESE NOTES.
Do NOT substitute another topic.
Do NOT use a previous topic or example from memory.
Do NOT invent a different subject.

Theme / Idea: ${themeIdea || "Educational explanation"}
Target Audience: ${targetAudience || "General Public"}
Visual Style: ${visualStyle || "2D Motion Graphics"}

LECTURER NOTES:
<<<
${noteContent || "No lecture text was provided."}
>>>

TASK:
Create a concise, student-friendly synthesis of the lecturer's notes.

Return ONLY valid JSON.
Do not include <think>.
Do not include reasoning.
Do not include markdown or code fences.
Do not add any fields outside this structure.

Use exactly this structure:

{
  "summary": "A complete 80-120 word summary based ONLY on the lecturer notes.",
  "keyConcepts": ["concept 1", "concept 2", "concept 3", "concept 4"],
  "suggestedTitles": ["title 1", "title 2", "title 3"],
  "difficultyLevel": "Beginner",
  "coreTakeaway": "One concise sentence based on the lecturer notes."
}

IMPORTANT:
- The summary MUST be about the lecturer notes.
- The keyConcepts MUST come from the lecturer notes.
- The titles MUST reflect the lecturer topic.
- Use exactly 4 key concepts and exactly 3 titles.
- If the notes are about the Doppler effect, do not discuss machine learning.
- If the notes are about another topic, stay strictly on that topic.
- Keep every field concise so the JSON can be completed fully.`;

      console.log("[Intel OpenVINO] selectedModel:", selectedModel);
      console.log("[Intel OpenVINO] noteContent length:", noteContent?.length || 0);
      console.log("[Intel OpenVINO] noteContent preview:", (noteContent || "").slice(0, 500));
      console.log("[Intel OpenVINO] Prompt preview:", promptText.slice(0, 2000));

      try {
        const intelResponse = await fetch("http://127.0.0.1:8000/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: promptText,
            max_new_tokens: 700,
          }),
        });

        if (!intelResponse.ok) {
          const errorText = await intelResponse.text();
          throw new Error(
            `OpenVINO service returned HTTP ${intelResponse.status}: ${errorText}`
          );
        }

        const intelData = await intelResponse.json();

        if (!intelData || typeof intelData.text !== "string") {
          throw new Error("OpenVINO response did not contain a text field.");
        }

        let cleanedText = intelData.text.trim();

        // Qwen may expose its reasoning block. Remove it before JSON parsing.
        const thinkEnd = cleanedText.indexOf("</think>");
        if (thinkEnd !== -1) {
          cleanedText = cleanedText.slice(thinkEnd + "</think>".length).trim();
        }

        // Remove accidental Markdown fences.
        cleanedText = cleanedText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        // If the model wrapped the JSON in extra text, extract the outermost
        // JSON object as a final recovery step.
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          cleanedText = cleanedText.slice(firstBrace, lastBrace + 1);
        }
        console.log("[Intel OpenVINO] Cleaned Stage 1 output:");
        console.log(cleanedText); 
        let parsedIntel: any;
        try {
          parsedIntel = JSON.parse(cleanedText);
        } catch (parseError: any) {
          console.error("[Intel OpenVINO] Invalid JSON returned by model:");
          console.error(cleanedText);

          throw new Error(
            `OpenVINO returned incomplete or invalid JSON: ${parseError.message}`
          );
        }

        const keyConcepts = Array.isArray(parsedIntel.keyConcepts)
          ? parsedIntel.keyConcepts.map(String).slice(0, 6)
          : [];

        const suggestedTitles = Array.isArray(parsedIntel.suggestedTitles)
          ? parsedIntel.suggestedTitles.map(String).slice(0, 3)
          : [];

        const coreTakeaway =
          typeof parsedIntel.coreTakeaway === "string"
            ? parsedIntel.coreTakeaway.trim()
            : "";

        let summary =
          typeof parsedIntel.summary === "string"
            ? parsedIntel.summary.trim()
            : "";

        // Safety fallback if the model does not return a summary
        if (!summary) {
          summary =
            coreTakeaway ||
            `This lesson explains the key ideas of ${keyConcepts.slice(0, 3).join(", ")} and how they relate to the topic.`;
        }

        const result = {
          summary,
          keyConcepts,
          suggestedTitles,
          difficultyLevel:
            typeof parsedIntel.difficultyLevel === "string"
              ? parsedIntel.difficultyLevel
              : (targetAudience || "Intermediate"),
          coreTakeaway,
        };
        console.log("[Intel OpenVINO] Stage 1 response generated successfully");
        return res.json(result);
      } catch (intelError: any) {
        console.error("[Intel OpenVINO] Stage 1 error:", intelError);
        return res.status(500).json({
          error: intelError?.message || "Intel OpenVINO generation failed",
          fallback: false,
          engine: "intel-openvino-qwen3"
        });
      }
    }

    // ============================================================
    // EXISTING GEMINI PATH
    // Keep the original Gemini/fallback behavior unchanged.
    // ============================================================
    const model = selectedModel || "gemini-3.6-flash";
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response if no API key
      return res.json({
        summary: noteContent ? noteContent.slice(0, 300) + "..." : "Summary of uploaded educational document.",
        keyConcepts: ["Core Principles", "Key Mechanisms", "Practical Applications", "Summary Takeaways"],
        suggestedTitles: [
          themeIdea ? `Exploring ${themeIdea}` : "Mastering Educational Concepts",
          "Visual Journey Through Key Concepts",
          "An Interactive Animated Guide"
        ],
        difficultyLevel: targetAudience || "Intermediate",
        coreTakeaway: "Understanding the underlying principles through visual animations and engaging storytelling."
      });
    }

    const promptText = `You are an expert instructional designer and science communicator. Analyze the provided educational notes/document and the theme request.
Theme/Idea: ${themeIdea || "Engaging visual narrative"}
Target Audience: ${targetAudience || "General Public"}
Visual Style: ${visualStyle || "2D Motion Graphics"}

Provided Notes/Content:
${noteContent || "See attached document file"}

Extract and structure the core key points in JSON:
1. summary (2-3 concise paragraphs summarizing the entire document)
2. keyConcepts (Array of 4-6 key technical concepts or terminology)
3. suggestedTitles (Array of 3 punchy catchy video title ideas)
4. difficultyLevel (e.g. Beginner, Intermediate, Advanced)
5. coreTakeaway (1 memorable sentence summarizing what viewers will learn)`;

    let contentsPayload: any = promptText;

    if (noteFileBase64 && noteFileMime) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: noteFileBase64.replace(/^data:[^;]+;base64,/, ""),
              mimeType: noteFileMime,
            },
          },
          { text: promptText },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents: contentsPayload,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedTitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            difficultyLevel: { type: Type.STRING },
            coreTakeaway: { type: Type.STRING },
          },
          required: ["summary", "keyConcepts", "suggestedTitles", "difficultyLevel", "coreTakeaway"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (error: any) {
    console.error("Error in /api/stage1/process-notes:", error);
    res.status(500).json({
      error: error.message || "Failed to process notes",
      fallback: true
    });
  }
});


// Stage 2: Generate Interactive Storyline
app.post("/api/stage2/generate-storyline", async (req, res) => {
  try {
    const { parsedNotes, themeIdea, targetAudience, visualStyle, narrativeTone, targetDuration, selectedModel } = req.body;
    const model = selectedModel || "gemini-3.6-flash";

    if (selectedModel === "demo") {
      return res.json(DEMO_STAGE2_DATA);
    }

// =========================================================
// INTEL OPENVINO PATH - STAGE 2
// =========================================================
    if (selectedModel === "intel-openvino-qwen3") {
      try {
        console.log("[Intel OpenVINO] Stage 2 selected");

        const intelPrompt = `You are a world-class educational video director and script writer.

    Create a structured 4-6 chapter educational storyline based on the lesson information below.

    Target Audience: ${targetAudience || "General Public"}
    Visual Style: ${visualStyle || "2D Motion Graphics"}
    Narrative Tone: ${narrativeTone || "Enthusiastic & Friendly"}
    Target Video Duration: ${targetDuration || 60} seconds
    Theme / Idea: ${themeIdea || "Educational explanation"}

    Core Summary:
    ${parsedNotes?.summary || ""}

    Key Concepts:
    ${JSON.stringify(parsedNotes?.keyConcepts || [])}

    Core Takeaway:
    ${parsedNotes?.coreTakeaway || ""}

    IMPORTANT:
    The storyline MUST be specific to the actual educational topic.
    Do not invent unrelated topics.
    For example, if the topic is the Doppler effect, all chapters must explain the Doppler effect.

    Return ONLY valid JSON.
    Do not include markdown.
    Do not include <think>.
    Do not include reasoning outside the JSON.

    Use EXACTLY this structure:

    {
      "narrativeTone": "Enthusiastic & Friendly",
      "totalEstimatedDuration": 60,
      "chapters": [
        {
          "id": "chap-1",
          "chapterNumber": 1,
          "title": "Catchy chapter title",
          "conceptFocus": "Main educational concept",
          "narrativeHook": "Engaging spoken introduction",
          "visualAnimationCue": "Specific educational visual or animation",
          "interactiveElement": "Optional interactive learning element",
          "durationPercent": 20
        }
      ]
    }

    Requirements:
    - 4 to 6 chapters
    - durationPercent values must add up to 100
    - chapters must teach the actual topic
    - include useful visual explanations
    - suitable for secondary school students
    `;

        const intelResponse = await fetch(
          "http://127.0.0.1:8000/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: intelPrompt,
              max_new_tokens: 1400,
            }),
          }
        );

        if (!intelResponse.ok) {
          const errorText = await intelResponse.text();
          throw new Error(
            `OpenVINO Stage 2 error ${intelResponse.status}: ${errorText}`
          );
        }

        const intelData = await intelResponse.json();

        let cleanedText = String(intelData.text || "").trim();

        // Remove Qwen reasoning
        if (cleanedText.includes("<think>")) {
          const afterThink = cleanedText.split("</think>")[1];
          if (afterThink) {
            cleanedText = afterThink.trim();
          }
        }

        // Remove markdown code fences
        cleanedText = cleanedText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const parsedIntel = JSON.parse(cleanedText);

        const chapters = Array.isArray(parsedIntel.chapters)
          ? parsedIntel.chapters
          : [];

        if (chapters.length === 0) {
          throw new Error("OpenVINO returned no storyline chapters.");
        }

        console.log(
          `[Intel OpenVINO] Stage 2 generated ${chapters.length} chapters`
        );

        return res.json({
          narrativeTone:
            typeof parsedIntel.narrativeTone === "string"
              ? parsedIntel.narrativeTone
              : (narrativeTone || "Enthusiastic & Friendly"),

          totalEstimatedDuration:
            Number(parsedIntel.totalEstimatedDuration) ||
            Number(targetDuration) ||
            60,

          chapters: chapters.slice(0, 6).map((chapter: any, index: number) => ({
            id: String(chapter.id || `chap-${index + 1}`),
            chapterNumber: Number(chapter.chapterNumber) || index + 1,
            title: String(chapter.title || `Chapter ${index + 1}`),
            conceptFocus: String(
              chapter.conceptFocus || "Key Concept"
            ),
            narrativeHook: String(
              chapter.narrativeHook || ""
            ),
            visualAnimationCue: String(
              chapter.visualAnimationCue || ""
            ),
            interactiveElement:
              chapter.interactiveElement
                ? String(chapter.interactiveElement)
                : undefined,
            durationPercent:
              Number(chapter.durationPercent) || 0,
          })),
        });
      } catch (intelError: any) {
        console.error(
          "[Intel OpenVINO] Stage 2 failed:",
          intelError
        );

        return res.status(500).json({
          error:
            intelError.message ||
            "Intel OpenVINO Stage 2 generation failed",
          fallback: true,
        });
      }
    }

    // =========================================================
    // EXISTING GEMINI PATH
    // =========================================================

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback mock storyline
      return res.json({
        narrativeTone: narrativeTone || "Enthusiastic & Friendly",
        totalEstimatedDuration: targetDuration || 60,
        chapters: [
          {
            id: "chap-1",
            chapterNumber: 1,
            title: "The Hook: What If You Could See the Unseen?",
            conceptFocus: "Introduction & Motivation",
            narrativeHook: `Imagine shrinking down to microscopic scale where energy comes alive! ${themeIdea || 'In this lesson, we break down the main concepts.'}`,
            visualAnimationCue: "Zoom camera into a glowing cell/qubit structure with energetic light particles",
            interactiveElement: "Click on glowing energy nodes to inspect light wavelengths",
            durationPercent: 15
          },
          {
            id: "chap-2",
            chapterNumber: 2,
            title: "Core Mechanics Explained",
            conceptFocus: parsedNotes?.keyConcepts?.[0] || "Primary Mechanism",
            narrativeHook: `Let's break down step 1: how raw inputs transform into powerful energy reactions.`,
            visualAnimationCue: "Split-screen schematic comparing classical vs animated interactive state",
            interactiveElement: "Drag slider to control input intensity and observe reaction speed",
            durationPercent: 30
          },
          {
            id: "chap-3",
            chapterNumber: 3,
            title: "Deep Dive: The Real World Analogy",
            conceptFocus: parsedNotes?.keyConcepts?.[1] || "System Interactions",
            narrativeHook: "Think of this like an interconnected city grid during peak hour traffic.",
            visualAnimationCue: "3D isometric city view where glowing pulses flow along glowing highways",
            interactiveElement: "Toggle system parameters to prevent bottlenecks",
            durationPercent: 35
          },
          {
            id: "chap-4",
            chapterNumber: 4,
            title: "Summary & Master Takeaway",
            conceptFocus: "Synthesis & Future Applications",
            narrativeHook: `Now you hold the key! ${parsedNotes?.coreTakeaway || 'This process powers modern science.'}`,
            visualAnimationCue: "Camera pulls back to show the full completed ecosystem operating in harmony",
            interactiveElement: "3D interactive trophy / certificate badge unlock",
            durationPercent: 20
          }
        ]
      });
    }

    const promptText = `You are a world-class educational video director and script writer.
Create a structured 4-6 chapter storyline arc to explain these educational notes.

Target Audience: ${targetAudience}
Visual Style: ${visualStyle}
Narrative Tone: ${narrativeTone}
Target Video Duration: ${targetDuration || 60} seconds
Theme / Idea: ${themeIdea}
Core Summary: ${parsedNotes?.summary || ''}
Key Concepts: ${JSON.stringify(parsedNotes?.keyConcepts || [])}

Generate a JSON object containing:
1. narrativeTone
2. totalEstimatedDuration
3. chapters: Array of objects with properties:
   - id: unique string e.g. "chap-1"
   - chapterNumber: number (1, 2, 3...)
   - title: catchy chapter title
   - conceptFocus: main concept addressed
   - narrativeHook: the engaging narrative script opening for this chapter
   - visualAnimationCue: precise 2D/3D animation cue for motion designers
   - interactiveElement: optional interactive element cue for viewer
   - durationPercent: estimated percentage of total video duration (summing to 100)`;

    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrativeTone: { type: Type.STRING },
            totalEstimatedDuration: { type: Type.INTEGER },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  chapterNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  conceptFocus: { type: Type.STRING },
                  narrativeHook: { type: Type.STRING },
                  visualAnimationCue: { type: Type.STRING },
                  interactiveElement: { type: Type.STRING },
                  durationPercent: { type: Type.INTEGER },
                },
                required: ["id", "chapterNumber", "title", "conceptFocus", "narrativeHook", "visualAnimationCue", "durationPercent"],
              },
            },
          },
          required: ["narrativeTone", "totalEstimatedDuration", "chapters"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (error: any) {
    console.error("Error in /api/stage2/generate-storyline:", error);
    res.status(500).json({ error: error.message || "Failed to generate storyline" });
  }
});

// Stage 3: Generate Scene-by-Scene Production Script
app.post("/api/stage3/generate-script", async (req, res) => {
  try {
    const {
      chapters,
      visualStyle,
      targetAudience,
      targetDuration,
      selectedModel
    } = req.body;

    const model = selectedModel || "gemini-3.6-flash";

    if (selectedModel === "demo") {
      return res.json(DEMO_STAGE3_DATA);
    }

    // ============================================================
    // INTEL OPENVINO PATH - STAGE 3
    // ============================================================
    if (selectedModel === "intel-openvino-qwen3") {
      try {
        console.log("[Intel OpenVINO] Stage 3 selected");
        console.log(
          "[Intel OpenVINO] Stage 3 chapters:",
          Array.isArray(chapters) ? chapters.length : 0
        );

        const safeChapters = Array.isArray(chapters)
          ? chapters.slice(0, 6)
          : [];

        if (safeChapters.length === 0) {
          throw new Error("No storyline chapters were provided to Stage 3.");
        }

        const sceneCount = Math.min(6, Math.max(4, safeChapters.length));

        const intelPrompt = `You are an expert educational video director and script writer.

Convert the storyline chapters below into a concise scene-by-scene production script for a secondary-school educational video.

The actual lesson topic MUST remain the same throughout the script.
Do NOT introduce unrelated topics.
The story device/theme can be used, but scientific accuracy and the educational concepts in the chapters are the priority.

VISUAL STYLE:
${visualStyle || "2D Motion Graphics"}

TARGET AUDIENCE:
${targetAudience || "Middle/High School"}

TARGET TOTAL DURATION:
${targetDuration || 60} seconds

STORYLINE CHAPTERS:
${JSON.stringify(safeChapters, null, 2)}

Create exactly ${sceneCount} scenes.

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON.
- Do not include <think>.
- Do not include reasoning.
- Do not include markdown or code fences.
- Keep every text field concise so the response finishes completely.
- Each scene must directly teach or reinforce the lesson.
- Every videoPrompt MUST reference the Stage 5 generated scene image as the visual base/reference.
- The dialogueNarrative must be suitable for spoken educational narration.
- Use formal, neutral, classroom-appropriate English.
- Do not use slang, texting language, filler words, jokes, hype, idioms, or casual audience address.
- Do not use contractions when a formal alternative is natural.
- State scientific terms, numbers, units, and symbols precisely.
- Write only the narration that should be spoken aloud; do not include stage directions or pronunciation notes.
- Keep total duration close to ${targetDuration || 60} seconds.

Use exactly this structure:

{
  "globalMusicGenre": "Uplifting educational cinematic",
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "durationSec": 12,
      "sceneTitle": "Short scene title",
      "visualDescription": "Concise description of the educational visual.",
      "dialogueNarrative": "Concise spoken narration.",
      "cameraAngle": "Wide Shot (Pan)",
      "lightingMood": "Clear, energetic educational lighting",
      "bgMusicPrompt": "Light educational background music",
      "motionGraphicType": "Diagram Reveal",
      "imagePrompt": "Detailed prompt for the Stage 5 keyframe image. Include the subject, composition, educational visual elements, characters if needed, and ${visualStyle || "educational visual style"}.",
      "videoPrompt": "Using the Stage 5 generated scene image keyframe as the visual reference: describe the camera motion and subject movement."
    }
  ]
}

Allowed cameraAngle values:
Wide Shot (Pan), Medium Push-in, Close-up Focus, Top-down Overhead, Dynamic 360 Rotation, Dutch Angle Tilt, Split Screen Comparison

Allowed motionGraphicType values:
Diagram Reveal, Animated Text Callout, Flowchart Connector, Graph Plotting, 3D Object Spin, Particle Burst, None
`;

        const intelResponse = await fetch(
          "http://127.0.0.1:8000/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: intelPrompt,
              max_new_tokens: 2200,
              stage: "stage3",
            }),
          }
        );

        if (!intelResponse.ok) {
          const errorText = await intelResponse.text();
          throw new Error(
            `OpenVINO Stage 3 error ${intelResponse.status}: ${errorText}`
          );
        }

        const intelData = await intelResponse.json();

        if (!intelData || typeof intelData.text !== "string") {
          throw new Error(
            "OpenVINO Stage 3 response did not contain a text field."
          );
        }

        let cleanedText = intelData.text.trim();

        // Remove any visible reasoning block.
        const thinkEnd = cleanedText.indexOf("</think>");
        if (thinkEnd !== -1) {
          cleanedText = cleanedText
            .slice(thinkEnd + "</think>".length)
            .trim();
        }

        // Remove accidental Markdown fences.
        cleanedText = cleanedText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        // Extract an outer JSON object if the model added extra text.
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");

        if (firstBrace >= 0 && lastBrace > firstBrace) {
          cleanedText = cleanedText.slice(firstBrace, lastBrace + 1);
        }

        console.log("[Intel OpenVINO] Stage 3 raw/cleaned output:");
        console.log(cleanedText);

        let parsedIntel: any;

        try {
          parsedIntel = JSON.parse(cleanedText);
        } catch (parseError: any) {
          throw new Error(
            `OpenVINO Stage 3 returned invalid JSON: ${parseError.message}`
          );
        }

        const generatedScenes = Array.isArray(parsedIntel.scenes)
          ? parsedIntel.scenes
          : [];

        if (generatedScenes.length === 0) {
          throw new Error("OpenVINO returned no scene scripts.");
        }

        const scenes = generatedScenes.slice(0, 8).map(
          (scene: any, index: number) => ({
            id: String(scene.id || `scene-${index + 1}`),
            sceneNumber:
              Number(scene.sceneNumber) || index + 1,
            durationSec:
              Number(scene.durationSec) ||
              Math.round((Number(targetDuration) || 60) / generatedScenes.length),
            sceneTitle:
              String(scene.sceneTitle || `Scene ${index + 1}`),
            visualDescription:
              String(scene.visualDescription || ""),
            dialogueNarrative:
              String(scene.dialogueNarrative || ""),
            cameraAngle:
              String(scene.cameraAngle || "Medium Push-in"),
            lightingMood:
              String(scene.lightingMood || "Clear educational lighting"),
            bgMusicPrompt:
              String(scene.bgMusicPrompt || "Light educational background music"),
            motionGraphicType:
              String(scene.motionGraphicType || "None"),
            imagePrompt:
              String(scene.imagePrompt || ""),
            videoPrompt:
              String(scene.videoPrompt || ""),
          })
        );

        console.log(
          `[Intel OpenVINO] Stage 3 generated ${scenes.length} scenes`
        );

        return res.json({
          globalMusicGenre:
            typeof parsedIntel.globalMusicGenre === "string"
              ? parsedIntel.globalMusicGenre
              : "Uplifting Educational",
          scenes,
        });
      } catch (intelError: any) {
        console.error(
          "[Intel OpenVINO] Stage 3 failed:",
          intelError
        );

        return res.status(500).json({
          error:
            intelError?.message ||
            "Intel OpenVINO Stage 3 generation failed",
          fallback: false,
          engine: "intel-openvino-qwen3"
        });
      }
    }

    // ============================================================
    // EXISTING GEMINI PATH
    // Keep the original Gemini/fallback behavior unchanged.
    // ============================================================
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback scenes
      const numScenes = 5;
      const sceneDuration = Math.round((targetDuration || 60) / numScenes);
      return res.json({
        globalMusicGenre: "Uplifting Lo-Fi Beats",
        scenes: [
          {
            id: "scene-1",
            sceneNumber: 1,
            durationSec: sceneDuration,
            sceneTitle: "The Awakening Spark",
            visualDescription: "A glowing central orb of energy igniting against a deep dark navy grid background, surrounded by floating mathematical symbols.",
            dialogueNarrative: "Welcome! Today we unlock one of science's most fascinating secrets.",
            cameraAngle: "Wide Shot (Pan)",
            lightingMood: "Vibrant neon lighting with soft volumetric glow",
            bgMusicPrompt: "Uplifting lo-fi piano with soft acoustic kick synth",
            motionGraphicType: "Animated Text Callout",
            imagePrompt: "High-detail 3D vector artwork of a glowing central orb of energy igniting against a deep dark navy grid background, surrounded by floating mathematical symbols and light trails. Visual style: 3D Pixar Animation.",
            videoPrompt: "Using the Stage 5 scene keyframe image as the primary visual reference: smoothly pan the camera wide as the central orb pulses with vibrant neon energy, causing the floating mathematical symbols to slowly orbit and shimmer around it."
          },
          {
            id: "scene-2",
            sceneNumber: 2,
            durationSec: sceneDuration,
            sceneTitle: "Deconstructing the Core Mechanism",
            visualDescription: "The central orb splits into detailed sub-components showing directional flow arrows and molecular bonds.",
            dialogueNarrative: "Notice how energy transitions seamlessly across each layer without losing momentum.",
            cameraAngle: "Medium Push-in",
            lightingMood: "Bright high-contrast daylight palette",
            bgMusicPrompt: "Steady rhythmic electronic beat",
            motionGraphicType: "Diagram Reveal",
            imagePrompt: "Detailed educational schematic illustration showing a central energy orb splitting into sub-components with directional flow arrows and glowing molecular bonds on a clean dark background. Visual style: 3D Pixar Animation.",
            videoPrompt: "Using the Stage 5 scene keyframe image as the visual reference: slowly push the camera inward as the sub-components expand, with directional flow arrows animating smoothly along the molecular bond lines."
          },
          {
            id: "scene-3",
            sceneNumber: 3,
            durationSec: sceneDuration,
            sceneTitle: "Real World Analogy in Action",
            visualDescription: "Smooth cross-fade into an animated cityscape where data lines pulse through glass towers.",
            dialogueNarrative: "Just like traffic lights coordinating a busy city, this balance keeps the whole system stable.",
            cameraAngle: "Top-down Overhead",
            lightingMood: "Warm sunset tones with gold highlights",
            bgMusicPrompt: "Upbeat ambient guitar rhythm",
            motionGraphicType: "Flowchart Connector",
            imagePrompt: "Isometric 3D cityscape view during golden hour with glowing energy data lines coursing through glass skyscrapers and urban transit grids. Visual style: 3D Pixar Animation.",
            videoPrompt: "Using the Stage 5 scene keyframe image as visual reference: execute a slow overhead top-down sweep across the cityscape while glowing data lines pulse rapidly through the glass towers in a steady rhythm."
          },
          {
            id: "scene-4",
            sceneNumber: 4,
            durationSec: sceneDuration,
            sceneTitle: "The Breakthrough Moment",
            visualDescription: "3D graph rendering live data points connecting into a brilliant illuminated constellation.",
            dialogueNarrative: "When all conditions align, efficiency increases tenfold!",
            cameraAngle: "Dynamic 360 Rotation",
            lightingMood: "Epic blue-violet cosmic radiance",
            bgMusicPrompt: "Crescendo synth pad with swelling bass",
            motionGraphicType: "Graph Plotting",
            imagePrompt: "Cosmic 3D graph space with glowing data points linking together to form a brilliant illuminated constellation against a deep space background. Visual style: 3D Pixar Animation.",
            videoPrompt: "Using the Stage 5 scene keyframe image as the visual base: perform a dynamic 360-degree camera rotation around the 3D graph as new data points ignite and connect into the glowing constellation."
          },
          {
            id: "scene-5",
            sceneNumber: 5,
            durationSec: sceneDuration,
            sceneTitle: "The Final Recap & Key Takeaway",
            visualDescription: "Summary infographic dashboard displaying 3 bullet points alongside a glowing achievement badge.",
            dialogueNarrative: "To recap: input energy, structured transformation, and optimal output. You are now ready to apply this!",
            cameraAngle: "Close-up Focus",
            lightingMood: "Clean golden hour fill light",
            bgMusicPrompt: "Resolving harmonious chord",
            motionGraphicType: "Animated Text Callout",
            imagePrompt: "Sleek educational summary dashboard with glowing key takeaway badges, 3D achievement trophy, and clean typography card layout. Visual style: 3D Pixar Animation.",
            videoPrompt: "Using the Stage 5 scene keyframe image as the starting visual reference: focus close up on the central achievement badge as glowing checkmarks pop up sequentially alongside each summary takeaway."
          }
        ]
      });
    }

    const promptText = `You are an expert educational video director, science communicator, and prompt engineer for Gemini image and video generation.

Your task is to convert the storyline chapters into a precise scene-by-scene production script.

IMPORTANT:
Every scene must remain faithful to the actual educational topic.
Do not introduce unrelated objects, characters, environments, or concepts.
Each scene should teach one clear idea from the provided storyline.

Chapters:
${JSON.stringify(chapters)}

Visual Style:
${visualStyle}

Target Audience:
${targetAudience}

Target Total Duration:
${targetDuration || 60} seconds


Generate JSON with:

1. globalMusicGenre
2. scenes: Array of 5 to 8 scene objects containing:

- id
- sceneNumber
- durationSec
- sceneTitle

- visualDescription:
  Describe exactly what the viewer should see in the scene.
  Identify the main educational object, the environment,
  the action/state of the object, and the visual relationship
  between the important elements.

- dialogueNarrative:
  Short, formal educational narration explaining the concept shown. Use neutral classroom English without slang, filler, jokes, or ad-libbed commentary.

- cameraAngle:
  Choose from:
  ["Wide Shot (Pan)", "Medium Push-in", "Close-up Focus",
   "Top-down Overhead", "Dynamic 360 Rotation",
   "Dutch Angle Tilt", "Split Screen Comparison"]

- lightingMood:
  Describe the lighting and emotional tone.

- bgMusicPrompt:
  Describe the appropriate music style.

- motionGraphicType:
  Choose from:
  ["Diagram Reveal", "Animated Text Callout",
   "Flowchart Connector", "Graph Plotting",
   "3D Object Spin", "Particle Burst", "None"]


IMAGE PROMPT REQUIREMENTS:

The imagePrompt is specifically for Gemini image generation.

It MUST describe:

1. THEME
   - The exact educational theme of the scene.

2. MAIN OBJECT
   - The primary object, person, character, diagram,
     scientific phenomenon, or structure shown.

3. OBJECT ACTION / STATE
   - What the main object is doing or demonstrating.

4. CONTEXT / ENVIRONMENT
   - Where the scene takes place and what important
     background elements are visible.

5. COMPOSITION
   - Position of the main object, foreground/background
     relationships, camera framing, and visual focus.

6. EDUCATIONAL VISUALIZATION
   - Add scientifically meaningful diagrams,
     arrows, wave patterns, labels, comparisons,
     measurements, or other visual explanations when
     appropriate.

7. VISUAL STYLE
   - ${visualStyle}

The imagePrompt must produce a single coherent educational
keyframe, not a list of disconnected objects.

IMAGE PROMPT FORMAT:

"Educational scene about [THEME].
Main subject: [MAIN OBJECT].
Action/state: [WHAT IT IS DOING].
Environment: [CONTEXT].
Composition: [CAMERA / POSITION / FOREGROUND / BACKGROUND].
Educational visualization: [DIAGRAMS / ARROWS / LABELS / COMPARISONS].
Visual style: [STYLE].
Clear subject hierarchy, accurate educational representation,
high visual clarity, no irrelevant objects."


VIDEO PROMPT REQUIREMENTS:

The videoPrompt is specifically for generating a video
FROM THE GENERATED STAGE 5 IMAGE.

It MUST explicitly state that the generated image is the
PRIMARY VISUAL REFERENCE / STARTING IMAGE.

The video prompt must:

1. Begin by telling the video model to use the generated
   Stage 5 scene image as the primary visual reference.

2. Preserve the main subject, environment, composition,
   visual style, colors, and important educational elements
   from the image.

3. Describe exactly what moves.

4. Describe camera movement.

5. Describe environmental or secondary motion.

6. Describe any educational animation such as:
   wave propagation, arrows moving, particles flowing,
   diagrams appearing, graphs changing, or labels appearing.

7. Avoid introducing new main objects that were not in
   the generated image.

8. Keep the motion physically and scientifically consistent
   with the educational topic.

VIDEO PROMPT FORMAT:

"Use the generated Stage 5 scene image as the primary
visual reference and starting image.

Preserve the main subject, environment, composition,
colors, lighting, and visual style from the image.

Animate [MAIN SUBJECT MOVEMENT].
Animate [EDUCATIONAL PHENOMENON].
Camera movement: [CAMERA MOTION].
Environmental movement: [SECONDARY MOTION].
Keep the scene visually consistent with the reference image.
Do not introduce unrelated objects or change the identity
of the main subject.

The resulting video should visually explain:
[EDUCATIONAL CONCEPT]."


QUALITY RULES:

- Keep imagePrompt specific and visual.
- Keep videoPrompt focused on motion.
- Do not use vague instructions such as "make it interesting"
  or "make it move".
- Image prompt = what the scene looks like.
- Video prompt = how that exact image comes alive.
- Maintain visual continuity between image and video.
- Ensure every scene directly supports the lesson.
`;

    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalMusicGenre: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sceneNumber: { type: Type.INTEGER },
                  durationSec: { type: Type.INTEGER },
                  sceneTitle: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                  dialogueNarrative: { type: Type.STRING },
                  cameraAngle: { type: Type.STRING },
                  lightingMood: { type: Type.STRING },
                  bgMusicPrompt: { type: Type.STRING },
                  motionGraphicType: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                },
                required: ["id", "sceneNumber", "durationSec", "sceneTitle", "visualDescription", "dialogueNarrative", "cameraAngle", "lightingMood", "bgMusicPrompt", "motionGraphicType", "imagePrompt", "videoPrompt"],
              },
            },
          },
          required: ["globalMusicGenre", "scenes"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (error: any) {
    console.error("Error in /api/stage3/generate-script:", error);
    res.status(500).json({ error: error.message || "Failed to generate script" });
  }
});


// Stage 4: Voiceover Audio TTS Endpoint
app.post("/api/stage4/generate-tts", async (req, res) => {
  const { text, voiceName, selectedModel } = req.body;
  try {
    if (selectedModel === "demo") {
      return res.json({ useWebSpeechFallback: true, text, voiceName: voiceName || "Kore" });
    }

    if (selectedModel === "elevenlabs") {
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY?.trim();
      if (!elevenLabsKey) {
        return res.json({ useWebSpeechFallback: true, text, voiceName: voiceName || "Kore", error: "ELEVENLABS_API_KEY is missing" });
      }
      if (!elevenLabsKey.startsWith("sk_")) {
        return res.json({
          useWebSpeechFallback: true,
          text,
          voiceName: voiceName || "Kore",
          error: "ELEVENLABS_API_KEY must be the full secret API key beginning with sk_, not an API key ID",
        });
      }
      if (elevenLabsKey.length !== 51) {
        return res.json({
          useWebSpeechFallback: true,
          text,
          voiceName: voiceName || "Kore",
          error: `ELEVENLABS_API_KEY has an invalid length (${elevenLabsKey.length}); ElevenLabs requires the 51-character secret key shown when a key is created or rotated`,
        });
      }

      // Keep the voice ID server-side. Set ELEVENLABS_VOICE_ID to a voice from
      // the user's ElevenLabs account; this default is a documented example ID.
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
      const elevenLabs = new ElevenLabsClient({ apiKey: elevenLabsKey });
      const audioStream = await elevenLabs.textToSpeech.convert(voiceId, {
        text: String(text || "").trim(),
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
      });
      const audioBuffer = Buffer.from(await new Response(audioStream).arrayBuffer());
      return res.json({ audioDataUrl: `data:audio/mpeg;base64,${audioBuffer.toString("base64")}` });
    }
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        useWebSpeechFallback: true,
        text,
        voiceName: voiceName || "Kore"
      });
    }

    // Try Gemini TTS with a controlled narration instruction. The script is
    // content, not a conversation, so the model must not improvise wording.
    const narrationPrompt = buildGeminiNarrationPrompt(text);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: narrationPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audioDataUrl: `data:audio/wav;base64,${base64Audio}`
      });
    }

    res.json({ useWebSpeechFallback: true, text });
  } catch (error: any) {
    const message = error?.body?.detail?.message || error?.message || "TTS generation failed";
    console.warn("TTS generation failed, returning fallback flag:", message);
    res.json({ useWebSpeechFallback: true, text, voiceName: voiceName || "Kore", error: message });
  }
});

// Stage 5: Scene Keyframe Image Generator
app.post("/api/stage5/generate-scene-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, selectedModel, visualStyle } = req.body;
    if (selectedModel === "demo") {
      return res.json({ imageUrl: null, prompt, fallback: true });
    }
    if (selectedModel === "local-comfyui-image") {
      const dimensions = dimensionsForAspectRatio(aspectRatio);
      const result = await generateWithComfy("image", {
        "{{prompt}}": `${prompt}. Visual style: ${visualStyle || "clear educational illustration"}.`,
        "{{aspectRatio}}": aspectRatio || "16:9",
        "{{width}}": String(dimensions.width),
        "{{height}}": String(dimensions.height),
        "{{seed}}": String(Math.floor(Math.random() * 2_000_000_000)),
        "{{filename_prefix}}": "reanimate_image",
      });
      return res.json({ imageUrl: result.dataUrl, modelUsed: selectedModel, promptId: result.promptId });
    }
    let model = selectedModel || "gemini-3.1-flash-lite-image";
    if (model.includes("nano-banana")) {
      model = "imagen-3.0-generate-002";
    }
    const ai = getGeminiClient();

    const fullPrompt = `${prompt}. Visual style: ${visualStyle || '2D vector animation style, vibrant colors, clear educational vector illustration'}. High resolution, educational keyframe, beautiful lighting, centered subject.`;

    if (!ai) {
      return res.json({
        imageUrl: null,
        prompt: fullPrompt,
        fallback: true
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio as any) || "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        return res.json({
          imageUrl: `data:${mime};base64,${part.inlineData.data}`
        });
      }
    }

    res.json({ imageUrl: null, fallback: true });
  } catch (error: any) {
    console.error("Error generating scene image:", error);
    res.json({ imageUrl: null, error: error.message, fallback: true });
  }
});

// -------------------------------------------------------------------
// VITE OR STATIC SERVING
// -------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Saved pipeline JSON is application data, not source code. Watching
        // it causes Vite to reload the page during replay/autosave.
        watch: { ignored: ["**/sample_output/**"] },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduStudio AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
