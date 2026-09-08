import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// Stage 1: Process and synthesize educational notes
app.post("/api/stage1/process-notes", async (req, res) => {
  try {
    const { noteContent, noteFileBase64, noteFileMime, themeIdea, targetAudience, visualStyle, selectedModel } = req.body;
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
    const { chapters, visualStyle, targetAudience, targetDuration, selectedModel } = req.body;
    const model = selectedModel || "gemini-3.6-flash";
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

    const promptText = `You are an expert director for educational video production.
Translate the storyline chapters into a scene-by-scene script.

Chapters: ${JSON.stringify(chapters)}
Visual Style: ${visualStyle}
Target Audience: ${targetAudience}
Target Total Duration: ${targetDuration || 60} seconds

Generate JSON with:
1. globalMusicGenre (e.g. Uplifting Lo-Fi Beats, Cinematic Orchestral, Upbeat Synthwave)
2. scenes: Array of 5 to 8 scene objects with:
   - id: string e.g. "scene-1"
   - sceneNumber: number
   - durationSec: integer seconds for this scene
   - sceneTitle: short descriptive scene title
   - visualDescription: vivid details of art style, background elements, characters, and motion
   - dialogueNarrative: voiceover spoken narration line
   - cameraAngle: select from ["Wide Shot (Pan)", "Medium Push-in", "Close-up Focus", "Top-down Overhead", "Dynamic 360 Rotation", "Dutch Angle Tilt", "Split Screen Comparison"]
   - lightingMood: lighting & mood description
   - bgMusicPrompt: description of music feel for this scene
   - motionGraphicType: select from ["Diagram Reveal", "Animated Text Callout", "Flowchart Connector", "Graph Plotting", "3D Object Spin", "Particle Burst", "None"]
   - imagePrompt: Detailed text prompt for generating the still keyframe scene image in Stage 5. Explicitly state the subject, layout, atmosphere, and visual style (${visualStyle}).
   - videoPrompt: Text prompt for generating the scene video clip. CRITICAL: THIS VIDEO PROMPT MUST EXPLICITLY REFERENCE THE STAGE 5 SCENE IMAGE AS ITS VISUAL BASE/REFERENCE (e.g., "Using the Stage 5 generated scene image keyframe as the visual reference: [camera motion], [subject/character movement], [lighting/particle dynamics]...").`;

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
  const { text, voiceName } = req.body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        useWebSpeechFallback: true,
        text,
        voiceName: voiceName || "Kore"
      });
    }

    // Try Gemini TTS
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly and educationally: ${text}` }] }],
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
    console.warn("TTS API call failed or unsupported in model, returning fallback flag:", error?.message);
    res.json({ useWebSpeechFallback: true, text });
  }
});

// Stage 5: Scene Keyframe Image Generator
app.post("/api/stage5/generate-scene-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, selectedModel, visualStyle } = req.body;
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
      server: { middlewareMode: true },
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
