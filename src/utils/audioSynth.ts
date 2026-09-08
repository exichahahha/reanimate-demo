/**
 * Client-Side Audio Synthesis & Music Generator Engine
 * - Web Speech API Voice Narration fallback & preview
 * - Web Audio API Procedural Background Music Generator
 */

let audioCtx: AudioContext | null = null;
let activeMusicOscillators: OscillatorNode[] = [];
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Speak text using Web Speech API SpeechSynthesis
 */
export function speakText(
  text: string,
  voiceName?: string,
  rate = 1.0,
  pitch = 1.0,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported in this browser.');
    if (onEnd) onEnd();
    return null;
  }

  window.speechSynthesis.cancel(); // Stop current speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.max(0.7, Math.min(1.5, rate));
  utterance.pitch = Math.max(0.7, Math.min(1.5, pitch));

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    let chosenVoice = voices.find(v => v.name.toLowerCase().includes(voiceName?.toLowerCase() || 'google'));
    if (!chosenVoice) {
      chosenVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
    if (chosenVoice) utterance.voice = chosenVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Start procedural ambient background music
 */
export function startBackgroundMusic(genre: string = 'Lo-Fi', volume: number = 0.3) {
  stopBackgroundMusic();

  try {
    const ctx = getAudioContext();
    musicGainNode = ctx.createGain();
    musicGainNode.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
    musicGainNode.connect(ctx.destination);

    isMusicPlaying = true;

    let chords: number[][] = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];

    if (genre.toLowerCase().includes('synthwave')) {
      chords = [
        [146.83, 220.00, 293.66], // D minor
        [174.61, 220.00, 261.63], // F major
        [130.81, 196.00, 261.63], // C major
        [110.00, 164.81, 220.00], // A minor
      ];
    } else if (genre.toLowerCase().includes('orchestral') || genre.toLowerCase().includes('cinematic')) {
      chords = [
        [130.81, 196.00, 261.63, 329.63], // C maj7
        [110.00, 164.81, 220.00, 261.63], // A min7
        [174.61, 220.00, 261.63, 349.23], // F maj7
        [196.00, 246.94, 293.66, 392.00], // G7
      ];
    }

    let chordIdx = 0;

    const playChordLoop = () => {
      if (!isMusicPlaying || !musicGainNode) return;

      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach(freq => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = genre.toLowerCase().includes('synthwave') ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.01, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(volume * 0.1, ctx.currentTime + 0.3);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);

        osc.connect(noteGain);
        noteGain.connect(musicGainNode!);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4.0);

        activeMusicOscillators.push(osc);
      });

      if (isMusicPlaying) {
        setTimeout(playChordLoop, 4000);
      }
    };

    playChordLoop();
  } catch (err) {
    console.warn('Could not start procedural Web Audio music:', err);
  }
}

export function setMusicVolume(volume: number) {
  if (musicGainNode && audioCtx) {
    musicGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)) * 0.25, audioCtx.currentTime);
  }
}

export function stopBackgroundMusic() {
  isMusicPlaying = false;
  activeMusicOscillators.forEach(osc => {
    try { osc.stop(); } catch (_) {}
  });
  activeMusicOscillators = [];
}
