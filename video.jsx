// 5 LEI — Animated banknote presentation
// Cinematic deep-blue + neon red glow aesthetic.

// ── Tweakable defaults ─────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff1f3a",
  "glow": 1.0,
  "showChrome": true,
  "bgStyle": "midnight",
  "titleStyle": "flat"
} /*EDITMODE-END*/;

// Context that scenes / chrome read from
const TweakCtx = React.createContext(TWEAK_DEFAULTS);
const useTw = () => React.useContext(TweakCtx);

// ── Design tokens ───────────────────────────────────────────────────────────
const NAVY_DEEP = '#040d24';
const NAVY_MID = '#0a1a44';
const NAVY_HI = '#163070';
const NEON_RED = '#ff1f3a';
const NEON_PINK = '#ff5a72';

const titleFont = "'Manrope', 'Helvetica Neue', system-ui, sans-serif";
const monoFont = "'JetBrains Mono', ui-monospace, monospace";

// Neon text glow helper
const neonText = (s = 1, color = NEON_RED) => ({
  color: '#fff8f9',
  textShadow: `
    0 0 ${4 * s}px #fff,
    0 0 ${10 * s}px ${color},
    0 0 ${22 * s}px ${color},
    0 0 ${44 * s}px ${color},
    0 0 ${88 * s}px ${color}88
  `
});

const neonBox = (s = 1, color = NEON_RED) => ({
  boxShadow: `
    0 0 ${6 * s}px ${color},
    0 0 ${14 * s}px ${color},
    0 0 ${30 * s}px ${color}cc,
    0 0 ${60 * s}px ${color}66,
    inset 0 0 ${10 * s}px ${color}aa
  `
});

// ── Background: deep navy with radial vignette + drifting glow ─────────────
function CinematicBackground() {
  const t = useTime();
  const tw = useTw();
  const bg = {
    midnight: { hi: '#163070', mid: '#0a1a44', deep: '#040d24' },
    royal: { hi: '#1e3aa3', mid: '#0e1f6e', deep: '#06104a' },
    abyss: { hi: '#0a2050', mid: '#04102e', deep: '#020816' },
    teal: { hi: '#0e5070', mid: '#062a44', deep: '#02141e' }
  }[tw.bgStyle || 'midnight'];
  // subtle drift of the light center
  const cx = 50 + Math.sin(t * 0.15) * 4;
  const cy = 50 + Math.cos(t * 0.12) * 3;
  return (
    <React.Fragment>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at ${cx}% ${cy}%, ${bg.hi} 0%, ${bg.mid} 35%, ${bg.deep} 80%)`
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none'
      }} />
      {/* Film grain via subtle noise overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.07,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>")`,
        pointerEvents: 'none'
      }} />
    </React.Fragment>);

}

// ── Reusable: scene title with neon glow reveal ────────────────────────────
function SceneTitle({ index, text, y = 920, size = 64, color = '#ffffff', font = "'Inter', system-ui, sans-serif", glow: glowProp, showIndex = true }) {
  const tw = useTw();
  const accent = tw.accent || NEON_RED;
  // Default to flat white per user spec; tweak can opt back into neon glow
  const glowOn = glowProp === undefined ? tw.titleStyle === 'neon' : glowProp;
  const txtColor = color;
  const txtFont = font;
  const { localTime, duration } = useSprite();
  const appear = 0;
  const fadeIn = 0.5;
  const fadeOut = duration - 0.5;
  let opacity = 0;
  let dy = 0;
  let glowAmt = 0;
  if (localTime >= appear) {
    const t = clamp((localTime - appear) / fadeIn, 0, 1);
    opacity = t;
    glowAmt = t;
  }
  if (localTime > fadeOut) {
    const t = clamp((localTime - fadeOut) / 0.5, 0, 1);
    opacity = 1 - t;
  }
  const flicker = 1;

  const titleStyle = glowOn ?
  { color: txtColor, ...neonText(glowAmt * (tw.glow ?? 1), accent) } :
  { color: txtColor };

  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0, top: y,
      textAlign: 'center',
      opacity: opacity * flicker,
      transform: `translateY(${dy}px)`,
      pointerEvents: 'none'
    }}>
      {showIndex &&
      <div style={{
        fontFamily: txtFont,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '0.3em',
        color: glowOn ? NEON_PINK : '#ffffff',
        marginBottom: 16,
        ...(glowOn ? neonText(0.5, accent) : {})
      }}>
          0{index} / 07
        </div>
      }
      <div style={{
        fontFamily: txtFont,
        fontSize: size,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        ...titleStyle
      }}>
        {text}
      </div>
    </div>);

}

// ── Reusable: bottom progress dots + section label ─────────────────────────
function SceneChrome({ index, total = 7 }) {
  const t = useTime();
  const tw = useTw();
  if (tw.showChrome === false) return null;
  const accent = tw.accent || NEON_RED;
  return (
    <React.Fragment>
      {/* Top-right section dots (progress) */}
      <div style={{
        position: 'absolute', right: 80, top: 80,
        display: 'flex', gap: 14, alignItems: 'center'
      }}>
        {Array.from({ length: total }).map((_, i) =>
        <span key={i} style={{
          width: i + 1 === index ? 30 : 8,
          height: 8,
          borderRadius: 4,
          background: i + 1 === index ? accent : 'rgba(255,255,255,0.25)',
          boxShadow: i + 1 === index ? `0 0 10px ${accent}, 0 0 20px ${accent}` : 'none',
          transition: 'all 300ms'
        }} />
        )}
      </div>

    </React.Fragment>);

}

// ── Reusable: glowing horizontal/vertical measurement bracket ──────────────
function MeasureBracket({ x, y, length, label, orientation = 'h', progress = 1 }) {
  const tickSize = 22;
  const lineW = 3;
  const showLen = length * progress;

  if (orientation === 'h') {
    return (
      <div style={{ position: 'absolute', left: x, top: y, opacity: progress }}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: showLen, height: lineW,
          background: NEON_RED,
          boxShadow: `0 0 8px ${NEON_RED}, 0 0 16px ${NEON_RED}, 0 0 32px ${NEON_RED}88`
        }} />
        {/* end caps */}
        <div style={{ position: 'absolute', left: 0, top: -tickSize / 2, width: lineW, height: tickSize, background: NEON_RED, boxShadow: `0 0 8px ${NEON_RED}` }} />
        <div style={{ position: 'absolute', left: showLen - lineW, top: -tickSize / 2, width: lineW, height: tickSize, background: NEON_RED, boxShadow: `0 0 8px ${NEON_RED}`, opacity: progress > 0.95 ? 1 : 0 }} />
        {label && progress > 0.6 &&
        <div style={{ ...{
            position: 'absolute', left: showLen / 2, top: 14,
            transform: 'translateX(-50%)',
            fontFamily: monoFont,
            fontSize: 26, fontWeight: 700,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            opacity: clamp((progress - 0.6) / 0.4, 0, 1),
            ...neonText(0.7)
          }, fontFamily: "\"Times New Roman\"", lineHeight: "1.55", fontWeight: "800", fontSize: "29px", whiteSpace: "nowrap", padding: "2px 0px 0px" }}>
            {label}
          </div>
        }
      </div>);

  }
  // vertical
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: progress }}>
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: lineW, height: showLen,
        background: NEON_RED,
        boxShadow: `0 0 8px ${NEON_RED}, 0 0 16px ${NEON_RED}, 0 0 32px ${NEON_RED}88`
      }} />
      <div style={{ position: 'absolute', left: -tickSize / 2, top: 0, width: tickSize, height: lineW, background: NEON_RED, boxShadow: `0 0 8px ${NEON_RED}` }} />
      <div style={{ position: 'absolute', left: -tickSize / 2, top: showLen - lineW, width: tickSize, height: lineW, background: NEON_RED, boxShadow: `0 0 8px ${NEON_RED}`, opacity: progress > 0.95 ? 1 : 0 }} />
      {label && progress > 0.6 &&
      <div style={{
        position: 'absolute', left: 36, top: showLen / 2,
        transform: 'translateY(-50%)',
        fontFamily: monoFont,
        fontSize: 38, fontWeight: 700,
        letterSpacing: '0.05em',
        opacity: clamp((progress - 0.6) / 0.4, 0, 1),
        ...neonText(0.8)
      }}>
          {label}
        </div>
      }
    </div>);

}

// ── Banknote display with optional pan/zoom ─────────────────────────────────
function BanknoteImage({ src, width = 1400, x, y, scale = 1, rotate = 0, opacity = 1, glow = false }) {
  const w = width;
  const h = width / 1.895; // aspect ratio 127:67
  return (
    <div style={{
      position: 'absolute',
      left: x ?? (1920 - w) / 2,
      top: y ?? (1080 - h) / 2,
      width: w, height: h,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      transformOrigin: 'center',
      opacity,
      boxShadow: glow ?
      `0 0 60px rgba(255,31,58,0.3), 0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` :
      `0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`, padding: "0px"
    }}>
      <img src={src} alt="" style={{ display: 'block', objectFit: 'cover', height: "742px", width: "1405px", padding: "11px" }} />
    </div>);

}

// ── SCENE 1 — Dimensions: 127 × 67 mm ──────────────────────────────────────
function Scene1_Dimensions() {
  const { localTime, progress, duration } = useSprite();
  // Single linear fade-in shared by all elements
  const sceneIn = clamp(localTime / 0.5, 0, 1);
  const enter = sceneIn;
  const noteEntryDy = 0;
  // subtle ken-burns scale
  const kb = 1 + 0.03 * clamp(localTime / 6, 0, 1);
  // Rulers progress — linear, same time as everything else
  const hProg = sceneIn;
  const vProg = sceneIn;

  const noteW = 1400;
  const noteH = noteW / 1.895;
  const noteX = (1920 - noteW) / 2;
  // Push banknote down so title + 127 mm label sit clear above
  const noteTop = (1080 - noteH) / 2 + 80;

  return (
    <React.Fragment>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translateY(${noteEntryDy}px)`,
        opacity: enter
      }}>
        <BanknoteImage src="assets/avers.png" width={noteW} x={noteX} y={noteTop} scale={kb} glow />
      </div>

      {/* Horizontal ruler — across the top */}
      <div style={{ position: 'absolute', left: noteX, top: noteTop - 50, transform: `translateY(${noteEntryDy}px)`, opacity: enter }}>
        <MeasureBracket x={0} y={0} length={noteW} label="127 mm" progress={hProg} orientation="h" />
      </div>
      {/* Vertical ruler — right side */}
      <div style={{ position: 'absolute', left: noteX + noteW + 50, top: noteTop, transform: `translateY(${noteEntryDy}px)`, opacity: enter }}>
        <MeasureBracket x={0} y={0} length={noteH} label="67 mm" progress={vProg} orientation="v" />
      </div>

      <SceneTitle
        index={1}
        text="Suport pe polimer"
        y={120}
        size={64}
        showIndex={false} />
      
    </React.Fragment>);

}

// ── SCENE 2 — Fereastra transparentă ───────────────────────────────────────
// Camera zooms toward the left side of the note where the transparent window
// (music note) sits, then the detail crop slides in beside it with a glowing
// frame.
function Scene2_TransparentWindow() {
  const { localTime, duration } = useSprite();
  const noteW = 2400; // zoom-in: huge
  const noteH = noteW / 1.895;
  // Pan so left part of note is visible — the music-note window is around
  // ~16% from left edge of the avers.
  const focusX = 0.16;
  const focusY = 0.30;
  // Position: place note so the focus point is at (640, 540)
  const baseX = 640 - noteW * focusX;
  const baseY = 540 - noteH * focusY;
  // Slow drift
  const t = clamp(localTime / 7, 0, 1);
  const drift = -40 * t;

  // Everything fades in together — linear, no delay
  const detailIn = clamp(localTime / 0.5, 0, 1);
  const detailOut = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);
  const detailOpacity = detailIn * (1 - detailOut);

  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: baseX + drift, top: baseY, opacity: 0.85 }}>
        <BanknoteImage src="assets/avers.png" width={noteW} x={0} y={0} />
      </div>
      {/* Highlight circle around the music note window */}
      <div style={{
        position: 'absolute', left: 571 - 120, top: 540 - 120,


        border: `2px solid ${NEON_RED}`,
        ...neonBox(0.7),
        opacity: detailIn,
        transform: `scale(${0.8 + detailIn * 0.2})`, borderRadius: "25px", height: "381px", width: "326px", padding: "8px", margin: "-71px"
      }} />
      {/* Connector line from circle to detail */}
      <div style={{
        position: 'absolute', left: 691, top: 540,
        width: 428 * detailIn, height: 2,
        background: NEON_RED,
        boxShadow: `0 0 8px ${NEON_RED}, 0 0 16px ${NEON_RED}`,
        transformOrigin: 'left center',
        opacity: detailOpacity
      }} />

      {/* Detail panel */}
      <div style={{
        position: 'absolute', left: 1180, top: 280,
        width: 560, height: 560,
        opacity: detailOpacity,
        transform: `translateX(${(1 - detailIn) * 40}px) scale(${0.9 + detailIn * 0.1})`
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#fff',
          border: `2px solid ${NEON_RED}`,
          ...neonBox(1.2),
          overflow: 'hidden',
          padding: 12
        }}>
          <img src="assets/fereastra.png" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <SceneTitle index={2} text="Fereastra transparentă complexă" />
    </React.Fragment>);

}

// ── SCENE 3 — Filigranul (watermark) ───────────────────────────────────────
// Backlit watermark: show a soft light source behind the note, then reveal
// the watermark portrait crop.
function Scene3_Watermark() {
  const { localTime, duration } = useSprite();

  // The note has a slight static tilt
  const sceneIn = clamp(localTime / 0.5, 0, 1);
  const tilt = sceneIn;
  const rotate = -3 * tilt;
  // Backlight intensity ramps up together with everything else
  const lightIn = sceneIn;

  // Detail reveal — same time as scene-in
  const detailIn = sceneIn;
  const detailOut = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);
  const detailOpacity = detailIn * (1 - detailOut);

  return (
    <React.Fragment>
      {/* Backlight glow */}
      <div style={{
        position: 'absolute', left: 380, top: 360,
        width: 360, height: 360,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,240,200,0.55) 0%, rgba(255,200,150,0.3) 35%, transparent 70%)`,
        filter: `blur(${20 - 10 * lightIn}px)`,
        opacity: lightIn
      }} />

      {/* Banknote – held up to the light, slight tilt */}
      <div style={{
        position: 'absolute', left: 160, top: 220,
        width: 1100, height: 1100 / 1.895,
        transform: `rotate(${rotate}deg) scale(${0.98 + 0.04 * tilt})`,
        transformOrigin: 'center',
        boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`
      }}>
        <img src="assets/avers.png" style={{ width: '100%', height: '100%', display: 'block' }} />
        {/* Light bleed overlay simulating transmission */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 9% 55%, rgba(255,235,180,${0.5 * lightIn}) 0%, transparent 24%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none'
        }} />
        {/* Highlight outline over the watermark zone */}
        <div style={{
          position: 'absolute',
          left: '3%', top: '19%',

          borderRadius: '50%',
          border: `2px solid ${NEON_RED}`,
          boxShadow: `0 0 12px ${NEON_RED}, 0 0 28px ${NEON_RED}, inset 0 0 12px ${NEON_RED}aa`,
          opacity: clamp(localTime / 0.5, 0, 1),
          transform: 'scale(1)',
          transformOrigin: 'center', padding: "0px", height: "229px", width: "163px"
        }} />
      </div>

      {/* Watermark detail callout */}
      <div style={{
        position: 'absolute', left: 1320, top: 320,
        width: 480, height: 480,
        opacity: detailOpacity,
        transform: `translateY(${(1 - detailIn) * 30}px)`
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#f4eef6',
          border: `2px solid ${NEON_RED}`,
          ...neonBox(1.0),
          padding: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="assets/filigran.png" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
      </div>

      <SceneTitle index={3} text="Filigranul" />
    </React.Fragment>);

}

// ── SCENE 4 — Firul de siguranţă ───────────────────────────────────────────
// Vertical security thread glows red and pulses across the note.
function Scene4_SecurityThread() {
  const { localTime, duration } = useSprite();

  // Pan from right→center, slight zoom — linear
  const t = clamp(localTime / 7, 0, 1);
  const offsetX = -100 + 50 * t;

  const noteW = 1500;
  const noteH = noteW / 1.895;
  const noteX = (1920 - noteW) / 2 + offsetX;
  const noteY = (1080 - noteH) / 2;

  // Security thread position on the avers: approx ~31% from left
  const threadFrac = 0.36;
  const threadX = noteX + noteW * threadFrac;

  // All elements share one linear fade-in
  const sceneIn = clamp(localTime / 0.5, 0, 1);
  const threadIn = sceneIn;
  const pulse = 1;

  // Detail reveal — same time as scene-in
  const detailIn = sceneIn;
  const detailOut = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);
  const detailOpacity = detailIn * (1 - detailOut);

  return (
    <React.Fragment>
      <BanknoteImage src="assets/avers.png" width={noteW} x={noteX} y={noteY} />

      {/* Glowing thread highlight */}
      <div style={{ ...{
          position: 'absolute',
          left: threadX - 8, top: noteY - 30,
          width: 16, height: noteH + 60,
          background: `linear-gradient(180deg, transparent 0%, ${NEON_RED} 20%, ${NEON_RED} 80%, transparent 100%)`,
          opacity: threadIn * pulse * 0.85,
          boxShadow: `0 0 20px ${NEON_RED}, 0 0 40px ${NEON_RED}, 0 0 80px ${NEON_RED}`,
          filter: 'blur(2px)', padding: "87px", margin: "5px", borderStyle: "solid", borderWidth: "0px"
        }, height: "801px", width: "29px", background: "linear-gradient(transparent 0%, rgb(255, 31, 58) 20%, rgb(255, 31, 58) 80%, transparent 100%) center bottom", padding: "20px", margin: "15px" }} />

      {/* Detail panel */}
      <div style={{
        position: 'absolute', left: 1380, top: 340,
        width: 420, height: 440,
        opacity: detailOpacity,
        transform: `translateX(${(1 - detailIn) * 40}px)`
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#fff',
          border: `2px solid ${NEON_RED}`,
          ...neonBox(1.0),
          overflow: 'hidden'
        }}>
          <img src="assets/fir-siguranta.png" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <SceneTitle index={4} text="Firul de siguranţă" />
    </React.Fragment>);

}

// ── SCENE 5 — Microtextul ──────────────────────────────────────────────────
// Magnifying glass metaphor over the note, revealing microtext detail.
function Scene5_Microtext() {
  const { localTime, duration } = useSprite();

  // Note is zoomed in
  const noteW = 2200;
  const noteH = noteW / 1.895;
  // Focus on the RIGHT side of the avers — where the orange dot column +
  // microtext sit (~88% x, mid height).
  const focusX = 0.88;
  const focusY = 0.50;
  const baseX = 960 - noteW * focusX;
  const baseY = 540 - noteH * focusY;

  // Drift
  const t = clamp(localTime / 7, 0, 1);
  const drift = -20 * t;

  // Magnifier slides in linearly from the ear toward its final resting spot more to the left
  const dropProgress = clamp(localTime / 0.8, 0, 1);
  const magXStart = 560; // over Enescu's ear
  const magYStart = 540;
  const magXEnd = 200; // final spot more to the left
  const magYEnd = 540;
  const magX = magXStart + (magXEnd - magXStart) * dropProgress;
  const magY = magYStart + (magYEnd - magYStart) * dropProgress;

  // Detail reveal — linear, same time as scene
  const detailIn = clamp(localTime / 0.5, 0, 1);
  const detailOut = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);
  const detailOpacity = detailIn * (1 - detailOut);

  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: baseX + drift, top: baseY }}>
        <BanknoteImage src="assets/avers.png" width={noteW} x={0} y={0} />
      </div>

      {/* Magnifier lens */}
      <div style={{
        position: 'absolute', left: magX - 100, top: magY - 100,
        width: 200,
        borderRadius: '50%',
        border: `3px solid ${NEON_RED}`,
        ...neonBox(0.9),

        opacity: clamp(localTime / 0.3, 0, 1), height: "202px", padding: "6px", background: "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 31, 58, 0.06) 70%, transparent 100%) center top / auto"
      }} />

      {/* Magnified microtext detail crop */}
      <div style={{
        position: 'absolute', left: 120, top: 700,
        width: 460, height: 280,
        opacity: detailOpacity,
        transform: `translateY(${(1 - detailIn) * 30}px) scale(${0.9 + 0.1 * detailIn})`
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#fff',
          border: `2px solid ${NEON_RED}`,
          ...neonBox(1.0),
          overflow: 'hidden'
        }}>
          <img src="assets/microtext.png" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <SceneTitle index={5} text="Microtextul" />
    </React.Fragment>);

}

// ── SCENE 6 — Reversul bancnotei ───────────────────────────────────────────
// Flip from avers to revers with a 3D card-flip animation.
function Scene6_Revers() {
  const { localTime, duration } = useSprite();

  // Flip happens from t=0 to t=1.0 — linear, no delay
  const flipT = clamp(localTime / 1.0, 0, 1);
  const rotateY = flipT * 180;
  // Subtle scale dip during flip for cinematic feel — keep this tiny
  const scale = 1 - 0.04 * Math.sin(flipT * Math.PI);

  // Ken Burns after flip — linear
  const kb = 1 + 0.03 * clamp(localTime / 5, 0, 1);

  const noteW = 1500;
  const noteH = noteW / 1.895;

  // Show avers if flip<0.5, revers otherwise — use backface-visibility
  return (
    <React.Fragment>
      <div style={{
        position: 'absolute',
        left: (1920 - noteW) / 2,
        top: (1080 - noteH) / 2,
        width: noteW, height: noteH,
        perspective: 2400,
        transformStyle: 'preserve-3d'
      }}>
        <div style={{
          position: 'relative',
          width: '100%', height: '100%',
          transform: `rotateY(${rotateY}deg) scale(${scale * kb})`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0s',
          boxShadow: `0 40px 100px rgba(0,0,0,0.7)`
        }}>
          <img src="assets/avers.png" style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            backfaceVisibility: 'hidden',
            display: 'block'
          }} />
          <img src="assets/revers.png" style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'block'
          }} />
        </div>
      </div>

      <SceneTitle index={6} text="Reversul bancnotei" />
    </React.Fragment>);

}

// ── SCENE 7 — Fluorescenţă UV ──────────────────────────────────────────────
// Lights go off → UV lamp turns on → yellow "5" glows on dark banknote.
function Scene7_UV() {
  const { localTime, duration } = useSprite();

  // Phase 1 (0→1.2s): revers visible, then darkens
  // Phase 2 (1.2→2.0s): UV lamp turns on (purple wash sweeps in)
  // Phase 3 (2.0→end): UV detail revealed glowing
  // All UV effects come in together — linear, no delay
  const sceneIn = clamp(localTime / 0.6, 0, 1);
  const darkening = sceneIn;
  const uvSweep = sceneIn;
  const detailIn = sceneIn;
  const detailOut = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);
  const detailOpacity = detailIn * (1 - detailOut);

  // No flicker — keep glow steady
  const uvFlicker = 1;

  const noteW = 1400;
  const noteH = noteW / 1.895;
  const noteX = (1920 - noteW) / 2;
  const noteY = (1080 - noteH) / 2;

  return (
    <React.Fragment>
      {/* Revers banknote — UV scene */}
      <div style={{
        position: 'absolute',
        left: noteX, top: noteY,
        width: noteW, height: noteH
      }}>
        {/* Image alone gets the UV filter (dim + hue-shift) */}
        <img
          src="assets/revers.png"
          style={{
            width: '100%', height: '100%', display: 'block',
            filter: `brightness(${1 - 0.85 * darkening}) saturate(${1 - 0.7 * darkening}) hue-rotate(${280 * uvSweep}deg)`
          }} />
        
        {/* UV purple wash overlay (not filtered) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, rgba(80,30,160,${0.5 * uvSweep}) 0%, rgba(150,40,200,${0.4 * uvSweep}) 100%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none'
        }} />
        {/* UV lamp sweep */}
        <div style={{
          position: 'absolute',
          left: `${-30 + uvSweep * 130}%`,
          top: 0, bottom: 0,
          width: '30%',
          background: 'linear-gradient(90deg, transparent, rgba(180,80,255,0.4), transparent)',
          mixBlendMode: 'screen',
          opacity: uvSweep < 1 ? 1 : 0,
          pointerEvents: 'none'
        }} />

        {/* Glowing yellow 5 — positioned over the watermark area (UNFILTERED) */}
        <div style={{
          position: 'absolute',
          left: '48%', top: '8%',
          width: '12%', height: '22%',
          opacity: detailIn * uvFlicker,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 700,
            fontSize: 180,
            color: '#fff8a0',
            textShadow: `
              0 0 8px #fff8a0,
              0 0 24px #f4d020,
              0 0 50px #f4d020,
              0 0 80px #f4d020aa,
              0 0 120px #f4d02088
            `,
            fontStyle: 'italic'
          }}>5</div>
        </div>

      </div>

      {/* Detail card showing the UV reference image */}
      <div style={{
        position: 'absolute', left: 1380, top: 340,
        width: 460, height: 280,
        opacity: detailOpacity,
        transform: `translateX(${(1 - detailIn) * 40}px)`
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#000',
          border: `2px solid ${NEON_RED}`,
          ...neonBox(1.0),
          overflow: 'hidden'
        }}>
          <img src="assets/uv.png" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <SceneTitle index={7} text="Fluorescenţă în lumină ultravioletă" y={900} size={60} />
    </React.Fragment>);

}

// ── Scene wrapper that handles cross-fade between adjacent scenes ──────────
function CrossfadeScene({ start, end, fade = 1.0, children }) {
  const time = useTime();
  let opacity = 0;
  if (time < start) opacity = 0;else
  if (time < start + fade) opacity = (time - start) / fade;else
  if (time < end - fade) opacity = 1;else
  if (time < end) opacity = (end - time) / fade;else
  opacity = 0;

  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <Sprite start={start} end={end}>{children}</Sprite>
    </div>);

}

// ── Timecode label updater on root ─────────────────────────────────────────
function TimecodeLabel() {
  const t = useTime();
  React.useEffect(() => {
    const root = document.querySelector('[data-video-root]');
    if (root) root.setAttribute('data-screen-label', `t=${t.toFixed(1)}s`);
  }, [Math.floor(t)]);
  return null;
}

// ── Active scene chrome (shows correct dot index based on current time) ───
function ActiveChrome() {
  const t = useTime();
  // determine active index by scene start times
  const starts = [0, 6.5, 12.8, 19.1, 25.4, 31.7, 35.5];
  let idx = 1;
  for (let i = 0; i < starts.length; i++) {
    if (t >= starts[i]) idx = i + 1;
  }
  return <SceneChrome index={idx} total={7} />;
}

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return (
    <TweakCtx.Provider value={tweaks}>
      <div data-video-root data-screen-label="t=0.0s" style={{ position: 'absolute', inset: 0 }}>
        <Stage width={1920} height={1080} duration={45} background={'#040d24'} persistKey="5lei">
          <CinematicBackground />
          <TimecodeLabel />

          <CrossfadeScene start={0} end={7.3} fade={0.8}><Scene1_Dimensions /></CrossfadeScene>
          <CrossfadeScene start={6.5} end={13.6} fade={0.8}><Scene2_TransparentWindow /></CrossfadeScene>
          <CrossfadeScene start={12.8} end={19.9} fade={0.8}><Scene3_Watermark /></CrossfadeScene>
          <CrossfadeScene start={19.1} end={26.2} fade={0.8}><Scene4_SecurityThread /></CrossfadeScene>
          <CrossfadeScene start={25.4} end={32.5} fade={0.8}><Scene5_Microtext /></CrossfadeScene>
          <CrossfadeScene start={31.7} end={36.2} fade={0.7}><Scene6_Revers /></CrossfadeScene>
          <CrossfadeScene start={35.5} end={45.0} fade={0.7}><Scene7_UV /></CrossfadeScene>

          <ActiveChrome />
        </Stage>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Color & Glow" />
        <TweakColor
          label="Accent"
          value={tweaks.accent}
          options={['#ff1f3a', '#ff5a72', '#ff8c1f', '#1fe0a8', '#a070ff']}
          onChange={(v) => setTweak('accent', v)} />
        
        <TweakSlider
          label="Glow intensity"
          value={tweaks.glow}
          min={0} max={2} step={0.1}
          onChange={(v) => setTweak('glow', v)} />
        
        <TweakRadio
          label="Title style"
          value={tweaks.titleStyle}
          options={['neon', 'flat']}
          onChange={(v) => setTweak('titleStyle', v)} />
        
        <TweakSection label="Background" />
        <TweakSelect
          label="Tone"
          value={tweaks.bgStyle}
          options={['midnight', 'royal', 'abyss', 'teal']}
          onChange={(v) => setTweak('bgStyle', v)} />
        
        <TweakSection label="Layout" />
        <TweakToggle
          label="Show corner chrome"
          value={tweaks.showChrome}
          onChange={(v) => setTweak('showChrome', v)} />
        
      </TweaksPanel>
    </TweakCtx.Provider>);

}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);