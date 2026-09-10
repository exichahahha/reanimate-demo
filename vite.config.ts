import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import {defineConfig} from 'vite';


function chemicalBondingPreviewApi() {
  const root = path.resolve(__dirname, 'sample_output', 'run_1788705472717_bybmev');
  const readStage = (stage: number) => JSON.parse(fs.readFileSync(path.join(root, `stage${stage}`, 'data.json'), 'utf8'));
  return {
    name: 'chemical-bonding-preview-api',
    configureServer(server: any) {
      server.middlewares.use('/run-assets', (req: any, res: any, next: () => void) => {
        const relativePath = decodeURIComponent(String(req.url || '')).replace(/^\/+/, '');
        const assetPath = path.resolve(__dirname, 'sample_output', relativePath);
        const sampleRoot = path.resolve(__dirname, 'sample_output');
        if (!assetPath.startsWith(`${sampleRoot}${path.sep}`) || !fs.existsSync(assetPath)) return next();
        const extension = path.extname(assetPath).toLowerCase();
        const contentType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg'
          : extension === '.mp4' ? 'video/mp4'
          : extension === '.mp3' ? 'audio/mpeg'
          : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', fs.statSync(assetPath).size);
        fs.createReadStream(assetPath).pipe(res);
      });
      server.middlewares.use('/api/demo-sample/chemical-bonding', (_req: unknown, res: any) => {
        try {
          const stage1: any = readStage(1), stage2: any = readStage(2), stage3: any = readStage(3), stage4: any = readStage(4), stage5: any = readStage(5), stage6: any = readStage(6);
          const asset = (stage: number, name: string) => `/run-assets/run_1788705472717_bybmev/stage${stage}/${encodeURIComponent(name)}`;
          const voiceoverAssets = Object.fromEntries(Object.entries(stage4.voiceoverAssets || {}).map(([id, value]: [string, any]) => [id, { ...value, audioDataUrl: value.sourceFileName ? asset(4, value.sourceFileName) : value.audioDataUrl, isGenerating: false }]));
          const sceneImages = Object.fromEntries((stage3.scenes || []).map((scene: any, index: number) => [scene.id || `scene-${index + 1}`, { sceneId: scene.id || `scene-${index + 1}`, prompt: scene.imagePrompt || scene.visualDescription || '', aspectRatio: stage5.globalAspectRatio || '16:9', imageUrl: asset(5, `scene ${index + 1}.jpg`), modelUsed: 'local-file', isGenerating: false }]));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ stage1: { ...stage1, presetId: 'chemical-bonding' }, stage2, stage3, stage4: { ...stage4, voiceoverAssets }, stage5: { ...stage5, sceneImages }, stage6 }));
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Unable to load Chemical Bonding demo sample.' }));
        }
      });
    },
  };
}
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), chemicalBondingPreviewApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The standalone Vite preview forwards API calls to the Express app.
      // This prevents /api/demo-sample/* requests from falling through to index.html.
      proxy: {
        '/api': 'http://localhost:3000',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : { ignored: ['**/sample_output/**'] },
    },
  };
});
