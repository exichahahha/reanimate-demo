export function buildGeminiNarrationPrompt(text: string) {
  return `Read the following script as a polished educational voiceover.

Voice direction:
- Use formal, neutral, classroom-appropriate English.
- Speak clearly, calmly, and naturally at a moderate pace.
- Do not use slang, casual expressions, filler words, jokes, ad-libbing, or conversational embellishment.
- Do not add, remove, summarize, paraphrase, or repeat information.
- Pronounce scientific terms, symbols, abbreviations, numbers, and units carefully.
- Follow the punctuation and sentence boundaries in the script.

Script to read exactly in meaning:
<<<
${String(text || '').trim()}
>>>`;
}

export function buildElevenLabsRequestPreview(text: string) {
  return JSON.stringify({
    text: String(text || '').trim(),
    voice_id: 'Configured ELEVENLABS_VOICE_ID',
    model_id: 'eleven_v_2_5',
    output_format: 'mp3_44100_128',
  }, null, 2);
}
