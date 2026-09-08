<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9a87e335-cb17-4a20-aee9-4dd1617bbdf4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [`.env`](.env) or [`.env.local`](.env.local) to your Gemini API key
3. To use the Stage 4 `ElevenLabs TTS` option, add the full secret `ELEVENLABS_API_KEY` to `.env` or `.env.local`. It must be the 51-character secret beginning with `sk_`; an ElevenLabs API key ID is not accepted. Optionally set `ELEVENLABS_VOICE_ID` to a voice ID from your ElevenLabs account.
4. Run the app:
   `npm run dev`

To run open vino local: 
```mkdir C:\EduVideoAI
cd C:\EduVideoAI

py -3.11 -m venv .venv

.\.venv\Scripts\Activate.ps1```
