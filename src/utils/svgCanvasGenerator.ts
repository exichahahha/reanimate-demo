/**
 * SVG Keyframe Artwork Generator
 * Creates beautiful procedural visual backgrounds and motion graphics layouts
 * matched to visual styles (Pixar, Cyberpunk, Vector, Chalkboard, etc.)
 */

export function generateSceneSvgDataUrl(
  title: string,
  visualStyle: string,
  sceneNumber: number,
  visualDescription: string,
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' = '16:9'
): string {
  let width = 1280;
  let height = 720;

  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1000;
    height = 1000;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  }

  // Determine color scheme based on visual style
  let bgGradient = ['#0f172a', '#1e293b', '#3b82f6'];
  let accentColor = '#60a5fa';
  let secondaryColor = '#f59e0b';
  let textColor = '#ffffff';
  let isDark = true;

  const styleLower = (visualStyle || '').toLowerCase();

  if (styleLower.includes('pixar') || styleLower.includes('3d')) {
    bgGradient = ['#1e1b4b', '#312e81', '#4f46e5'];
    accentColor = '#818cf8';
    secondaryColor = '#f43f5e';
  } else if (styleLower.includes('vector') || styleLower.includes('2d')) {
    bgGradient = ['#0f766e', '#0d9488', '#14b8a6'];
    accentColor = '#5eead4';
    secondaryColor = '#fbbf24';
  } else if (styleLower.includes('chalkboard') || styleLower.includes('whiteboard')) {
    bgGradient = ['#18181b', '#27272a', '#3f3f46'];
    accentColor = '#38bdf8';
    secondaryColor = '#facc15';
    textColor = '#f4f4f5';
  } else if (styleLower.includes('cyberpunk') || styleLower.includes('sci-fi') || styleLower.includes('isometric')) {
    bgGradient = ['#030712', '#111827', '#1f2937'];
    accentColor = '#22d3ee';
    secondaryColor = '#f43f5e';
  } else if (styleLower.includes('vintage') || styleLower.includes('textbook')) {
    bgGradient = ['#451a03', '#78350f', '#b45309'];
    accentColor = '#fde047';
    secondaryColor = '#f97316';
  }

  // Escape special chars in XML strings
  const cleanTitle = (title || `Scene ${sceneNumber}`)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  const cleanDesc = (visualDescription || '')
    .slice(0, 100)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="50%" stop-color="${bgGradient[1]}" />
        <stop offset="100%" stop-color="${bgGradient[2]}" />
      </linearGradient>
      
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0.8" />
      </linearGradient>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#gridPattern)" />

    <!-- Ambient Floating Orbs / Motion Graphic Geometry -->
    <circle cx="${width * 0.2}" cy="${height * 0.3}" r="${width * 0.18}" fill="${accentColor}" opacity="0.15" filter="url(#glow)" />
    <circle cx="${width * 0.8}" cy="${height * 0.7}" r="${width * 0.22}" fill="${secondaryColor}" opacity="0.12" filter="url(#glow)" />

    <!-- Central Interactive Diagram Graphic -->
    <g transform="translate(${width / 2}, ${height * 0.45})">
      <!-- Outer Pulsing Ring -->
      <circle cx="0" cy="0" r="${Math.min(width, height) * 0.22}" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="12 8" opacity="0.6"/>
      <!-- Inner Ring -->
      <circle cx="0" cy="0" r="${Math.min(width, height) * 0.15}" fill="none" stroke="${secondaryColor}" stroke-width="2" opacity="0.8"/>
      <!-- Center Core -->
      <circle cx="0" cy="0" r="${Math.min(width, height) * 0.08}" fill="url(#accentGrad)" filter="url(#glow)"/>

      <!-- Connecting Node Lines -->
      <line x1="0" y1="0" x2="${Math.min(width, height) * 0.3}" y2="${-Math.min(width, height) * 0.15}" stroke="${accentColor}" stroke-width="2" opacity="0.7"/>
      <circle cx="${Math.min(width, height) * 0.3}" cy="${-Math.min(width, height) * 0.15}" r="8" fill="${accentColor}"/>

      <line x1="0" y1="0" x2="${-Math.min(width, height) * 0.28}" y2="${Math.min(width, height) * 0.18}" stroke="${secondaryColor}" stroke-width="2" opacity="0.7"/>
      <circle cx="${-Math.min(width, height) * 0.28}" cy="${Math.min(width, height) * 0.18}" r="8" fill="${secondaryColor}"/>
    </g>

    <!-- Scene Number Pill Header -->
    <g transform="translate(40, 40)">
      <rect x="0" y="0" width="120" height="36" rx="18" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
      <text x="60" y="23" fill="${textColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">SCENE ${sceneNumber}</text>
    </g>

    <!-- Bottom Caption Overlay Container -->
    <g transform="translate(0, ${height - 140})">
      <rect width="${width}" height="140" fill="rgba(15, 23, 42, 0.75)" />
      <line x1="0" y1="0" x2="${width}" y2="0" stroke="url(#accentGrad)" stroke-width="2"/>
      
      <!-- Scene Title -->
      <text x="${width / 2}" y="45" fill="${textColor}" font-family="system-ui, sans-serif" font-size="${Math.max(18, Math.min(28, width / 35))}" font-weight="800" text-anchor="middle">${cleanTitle}</text>
      
      <!-- Visual Description Snippet -->
      <text x="${width / 2}" y="80" fill="rgba(255,255,255,0.75)" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">${cleanDesc}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
