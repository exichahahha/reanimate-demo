import { PresetSampleNote } from '../types';

export const SAMPLE_NOTES: PresetSampleNote[] = [
  {
    id: 'photosynthesis',
    title: 'Photosynthesis and Solar Energy',
    subject: 'Biology / Plant Science',
    iconName: 'Leaf',
    suggestedTheme: 'A tiny superhero chloroplast converting sunlight into chemical energy for a metropolis tree',
    content: `PHOTOSYNTHESIS & CELLULAR ENERGY

Overview:
Photosynthesis is the chemical process by which green plants, algae, and cyanobacteria convert light energy from the sun into chemical energy stored in glucose bonds.

Key Components:
1. Sunlight & Chlorophyll: Chlorophyll pigments inside chloroplasts absorb photons, primarily blue and red wavelengths, while reflecting green.
2. Light-Dependent Reactions (Thylakoids):
   - Water molecules (H2O) are split into Hydrogen ions, electrons, and Oxygen (O2) gas as a byproduct.
   - Converts light energy into ATP and NADPH.
3. Light-Independent Reactions / Calvin Cycle (Stroma):
   - Carbon Dioxide (CO2) from air is fixed using ATP & NADPH to produce Glucose (C6H12O6).

Chemical Equation:
6 CO2 + 6 H2O + Light Energy → C6H12O6 + 6 O2

Ecological Significance:
Photosynthesis produces atmospheric oxygen necessary for aerobic cellular respiration and forms the foundation of terrestrial and aquatic food pyramids.`
  },
  {
    id: 'doppler-effect-sound-waves',
    title: 'Doppler Effect of Sound Waves',
    subject: 'Physics / Sound',
    iconName: 'Radio',
    suggestedTheme: 'An ambulance siren racing through a city while sound waves compress and stretch around it',
    content: `DOPPLER EFFECT OF SOUND WAVES

Overview:
The Doppler effect is the change in observed sound frequency caused by motion between a sound source and an observer. When the source moves toward the observer, sound waves are compressed, causing a higher perceived pitch. When the source moves away, the waves spread out, causing a lower perceived pitch.

Key Components:
1. Sound Waves:
   - Sound travels as longitudinal waves through a medium such as air.
   - The particles of the medium vibrate back and forth in the same direction the wave travels.

2. Frequency and Pitch:
   - Frequency is the number of wave cycles passing a point per second.
   - Higher frequency means higher pitch.
   - Lower frequency means lower pitch.

3. Moving Source:
   - A moving siren, car horn, or ambulance changes how close together the wavefronts are.
   - In front of the moving source, wavefronts bunch together.
   - Behind the moving source, wavefronts spread apart.

4. Observed Effect:
   - Approaching source: higher frequency, shorter wavelength, higher pitch.
   - Receding source: lower frequency, longer wavelength, lower pitch.

Real-World Examples:
- Ambulance sirens sound higher as they approach and lower after they pass.
- Race cars seem to change pitch as they move past spectators.
- Bats and dolphins use frequency shifts in echoes to detect motion.

Core Takeaway:
The Doppler effect happens because motion changes the spacing of sound waves reaching an observer, changing the pitch that is heard.`
  },
  {
    id: 'chemical-bonding',
    title: 'Chemical Bonding',
    subject: 'Chemistry',
    iconName: 'Atom',
    suggestedTheme: 'Atoms meeting in a glowing molecular city where electrons transfer, share, and flow between neighborhoods',
    content: `CHEMICAL BONDING

Overview:
Chemical bonding is the force that holds atoms together in compounds. Atoms bond to become more stable, usually by gaining, losing, or sharing electrons in their outer energy levels.

Key Components:
1. Valence Electrons:
   - Valence electrons are the outermost electrons of an atom.
   - These electrons are responsible for chemical bonding.
   - Atoms often bond to achieve a full outer shell.

2. Ionic Bonding:
   - Ionic bonds form when electrons are transferred from one atom to another.
   - One atom becomes positively charged, and the other becomes negatively charged.
   - Opposite charges attract and hold the ions together.
   - Example: Sodium chloride, NaCl.

3. Covalent Bonding:
   - Covalent bonds form when atoms share electrons.
   - This usually happens between nonmetal atoms.
   - Shared electrons help each atom become more stable.
   - Example: Water, H2O.

4. Metallic Bonding:
   - Metallic bonds form between metal atoms.
   - Electrons move freely in a sea of electrons.
   - This explains why metals conduct electricity and can be shaped.

5. Bond Properties:
   - Ionic compounds often have high melting points and conduct electricity when dissolved.
   - Covalent compounds may have lower melting points and often do not conduct electricity.
   - Metals are usually shiny, malleable, ductile, and conductive.

Core Takeaway:
Atoms form chemical bonds by transferring, sharing, or pooling electrons so they can reach a more stable arrangement.`
  },
  {
    id: 'properties-of-waves',
    title: 'Properties of Waves',
    subject: 'Physics / Waves',
    iconName: 'Activity',
    suggestedTheme: 'A wave laboratory where glowing waves stretch, reflect, bend, and combine across different materials',
    content: `PROPERTIES OF WAVES

Overview:
A wave is a disturbance that transfers energy from one place to another without permanently moving matter. Waves can travel through matter, like sound waves, or through empty space, like light waves.

Key Components:
1. Amplitude:
   - Amplitude is the height of a wave from its rest position.
   - Greater amplitude means more energy.
   - For sound, greater amplitude means louder sound.

2. Wavelength:
   - Wavelength is the distance between matching points on a wave, such as crest to crest.
   - Shorter wavelengths usually mean higher frequencies.
   - Longer wavelengths usually mean lower frequencies.

3. Frequency:
   - Frequency is the number of waves passing a point each second.
   - It is measured in hertz.
   - Higher frequency waves carry more cycles per second.

4. Wave Speed:
   - Wave speed describes how fast a wave travels.
   - It depends on the medium and type of wave.
   - Wave speed can be calculated using: speed = frequency x wavelength.

5. Types of Waves:
   - Transverse waves move up and down while energy travels forward.
   - Longitudinal waves compress and stretch in the same direction as energy transfer.
   - Sound is longitudinal; many water and light wave models are transverse.

6. Wave Behaviors:
   - Reflection: waves bounce off a surface.
   - Refraction: waves bend when entering a new medium.
   - Diffraction: waves spread around obstacles or through gaps.
   - Interference: waves combine to become stronger or weaker.

Core Takeaway:
Waves transfer energy, and their behavior can be described using amplitude, wavelength, frequency, speed, and interactions with materials.`
  }
];

export const AI_MODELS: Record<string, any> = {
  text: [
    {
      id: 'gemini-flash-text-image',
      name: 'Gemini Flash (Text & Image)',
      description: 'Uses the saved local sample output for text analysis and visual concepts.',
      category: 'text',
      badge: 'Demo'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      description: 'Uses the saved Photosynthesis & Solar Energy sample output for this demo.',
      category: 'text',
      badge: 'Demo'
    }
  ],
  video: [
    {
      id: 'omni-flash',
      name: 'Omni Flash',
      description: 'Uses the saved local sample output for multimodal video generation.',
      category: 'video',
      badge: 'Demo'
    }
  ],
  image: [
    {
      id: 'gemini-flash-text-image',
      name: 'Gemini Flash (Text & Image)',
      description: 'Uses the saved local sample output for scene keyframe artwork.',
      category: 'image',
      badge: 'Demo'
    }
  ],
  audio: [
    {
      id: 'elevenlabs-tts',
      name: 'ElevenLabs TTS',
      description: 'Uses the saved local sample voiceovers for narration synthesis.',
      category: 'audio',
      badge: 'Demo'
    }
  ],
  music: [
    {
      id: 'web-audio-synth',
      name: 'Procedural Synth Engine',
      description: 'Generative dynamic lo-fi, orchestral, or ambient synth soundscape.',
      category: 'music',
      badge: 'Real-time'
    }
  ]
};
