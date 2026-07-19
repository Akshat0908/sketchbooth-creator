// ── Type definitions ─────────────────────────────────────────────────────────
export type PhotoFilter =
  | "none"
  | "vivid"       // iPhone Vivid — saturated + gentle S-curve, the "go-to" portrait filter
  | "warm"        // iPhone Warm — golden split-tone, gorgeous for skin
  | "goldenHour"  // Cinematic warm golden light
  | "chrome"      // iPhone Chrome — amber highlights, teal shadows, saturated
  | "process"     // Cross-process — cyan shadows, warm yellow highlights
  | "fade"        // iPhone Fade — lifted blacks, desaturated, slightly cool
  | "transfer"    // iPhone Transfer — warm-paper old-photo feel
  | "noir"        // iPhone Noir — high-contrast perceptual grayscale
  | "cool";       // iPhone Crisp — clean, slightly blue, sharp

export type FrameStyle =
  | "classic" | "polaroid" | "filmstrip" | "floral" | "torn"
  | "hearts" | "lovefilm";

export type OverlayEffect =
  | "none" | "hearts" | "bokeh" | "grain" | "lightleak" | "vignette" | "dust";

export interface BoothSettings {
  filter: PhotoFilter;
  frame: FrameStyle;
  overlay: OverlayEffect;
  caption: string;
}

export const DEFAULT_SETTINGS: BoothSettings = {
  filter: "vivid",
  frame: "hearts",
  overlay: "none",
  caption: "",
};

// ── Filters ───────────────────────────────────────────────────────────────────
// `css` → live video preview only (real-time, must be cheap).
// `gradePixels` → applied to each photo on final render (per-pixel, high quality).
export const FILTERS: { id: PhotoFilter; label: string; css: string }[] = [
  { id: "none",       label: "Original",      css: "" },
  { id: "vivid",      label: "Vivid ✦",       css: "saturate(1.4) contrast(1.06)" },
  { id: "warm",       label: "Warm ☀️",       css: "sepia(0.22) saturate(1.3) hue-rotate(-10deg) brightness(1.05)" },
  { id: "goldenHour", label: "Golden Hour",   css: "sepia(0.18) saturate(1.45) brightness(1.08) hue-rotate(-8deg)" },
  { id: "chrome",     label: "Chrome",        css: "saturate(1.3) contrast(1.1) brightness(1.03)" },
  { id: "process",    label: "Process",       css: "saturate(1.4) hue-rotate(12deg) contrast(1.18)" },
  { id: "fade",       label: "Fade",          css: "saturate(0.65) contrast(0.80) brightness(1.18)" },
  { id: "transfer",   label: "Transfer",      css: "sepia(0.32) saturate(0.72) contrast(0.84) brightness(1.12)" },
  { id: "noir",       label: "Noir",          css: "grayscale(1) contrast(1.28) brightness(0.94)" },
  { id: "cool",       label: "Crisp ❄️",     css: "saturate(0.85) hue-rotate(16deg) brightness(1.05) contrast(1.04)" },
];

// ── Frames ────────────────────────────────────────────────────────────────────
export const FRAMES: { id: FrameStyle; label: string; emoji: string }[] = [
  { id: "hearts",    label: "Hearts",     emoji: "🤍" },
  { id: "lovefilm",  label: "Love Film",  emoji: "🎞" },
  { id: "classic",   label: "Classic",    emoji: "▪" },
  { id: "polaroid",  label: "Polaroid",   emoji: "📷" },
  { id: "filmstrip", label: "Film Strip", emoji: "🎞" },
  { id: "floral",    label: "Floral",     emoji: "✿" },
  { id: "torn",      label: "Torn Paper", emoji: "📜" },
];

// ── Overlays ──────────────────────────────────────────────────────────────────
export const OVERLAYS: { id: OverlayEffect; label: string }[] = [
  { id: "none",      label: "None" },
  { id: "hearts",    label: "Hearts ♡" },
  { id: "bokeh",     label: "Bokeh ✨" },
  { id: "grain",     label: "Film Grain" },
  { id: "lightleak", label: "Light Leak" },
  { id: "vignette",  label: "Vignette" },
  { id: "dust",      label: "Dust & Scratches" },
];

// ── Color science helpers ─────────────────────────────────────────────────────
const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Perceptual luminance (sRGB Rec.709). Range: 0–255. */
const lumRGB = (r: number, g: number, b: number) =>
  r * 0.2126 + g * 0.7152 + b * 0.0722;

/**
 * Saturation adjustment that preserves perceptual luminance.
 * factor < 1 = desaturate, factor > 1 = saturate.
 */
function satAdj(
  r: number, g: number, b: number, factor: number,
): [number, number, number] {
  const l = lumRGB(r, g, b);
  return [
    clamp(l + (r - l) * factor),
    clamp(l + (g - l) * factor),
    clamp(l + (b - l) * factor),
  ];
}

/**
 * Smooth sigmoid S-curve for contrast.
 * steepness=0 → linear, steepness=1 → strong S-curve.
 * Operates on 0–255 range.
 */
function sCurve(v: number, steepness: number): number {
  const n = v / 255;
  const c =
    n < 0.5
      ? 0.5 * Math.pow(2 * n, 1 + steepness)
      : 1 - 0.5 * Math.pow(2 * (1 - n), 1 + steepness);
  return Math.round(c * 255);
}

// ── Per-pixel filter implementations ─────────────────────────────────────────
/**
 * Apply iPhone-quality color grading to a flat RGBA ImageData buffer.
 * All operations are per-pixel; no canvas state is needed.
 */
export function gradePixels(
  data: Uint8ClampedArray,
  _w: number,
  _h: number,
  filter: PhotoFilter,
): void {
  const len = data.length;

  switch (filter) {
    // ── Vivid ────────────────────────────────────────────────────────────────
    // The iPhone "Vivid" look: strong saturation, gentle S-curve, subtle warmth.
    case "vivid": {
      for (let i = 0; i < len; i += 4) {
        let [r, g, b] = satAdj(data[i], data[i+1], data[i+2], 1.38);
        // Gentle S-curve contrast
        r = sCurve(r, 0.30); g = sCurve(g, 0.30); b = sCurve(b, 0.30);
        // Subtle warmth in highlights (+4R, -3B in brights)
        const l = lumRGB(r, g, b) / 255;
        data[i]   = clamp(r + l * 4);
        data[i+1] = clamp(g + l * 2);
        data[i+2] = clamp(b - l * 3);
      }
      break;
    }

    // ── Warm ─────────────────────────────────────────────────────────────────
    // Golden-warm split-tone. Flattering on skin. Shadows get orange lift,
    // highlights get a golden push.
    case "warm": {
      for (let i = 0; i < len; i += 4) {
        const r0 = data[i], g0 = data[i+1], b0 = data[i+2];
        const l = lumRGB(r0, g0, b0) / 255;
        const shadow = 1 - l;
        let r = clamp(r0 + shadow * 16 + l * 12);
        let g = clamp(g0 + shadow * 6  + l * 5);
        let b = clamp(b0 - shadow * 12 - l * 10);
        // Saturation boost
        [r, g, b] = satAdj(r, g, b, 1.24);
        // Slight brightness
        data[i]   = clamp(r * 1.03);
        data[i+1] = clamp(g * 1.03);
        data[i+2] = clamp(b * 1.03);
      }
      break;
    }

    // ── Golden Hour ───────────────────────────────────────────────────────────
    // Cinematic warm light. Strong amber tint, glowing highlights.
    case "goldenHour": {
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        const l = lumRGB(r, g, b) / 255;
        // Global warm push
        r = clamp(r * 1.14 + 20);
        g = clamp(g * 1.06 + 8);
        b = clamp(b * 0.82 - 14);
        // Highlight glow (amber/yellow)
        if (l > 0.5) {
          const h = (l - 0.5) * 2;
          r = clamp(r + h * 24);
          g = clamp(g + h * 14);
        }
        // Shadow warmth (reduce blue in darks)
        if (l < 0.45) {
          const s = (0.45 - l) / 0.45;
          r = clamp(r + s * 14);
          b = clamp(b - s * 10);
        }
        let [rr, gg, bb] = satAdj(r, g, b, 1.22);
        data[i]   = rr; data[i+1] = gg; data[i+2] = bb;
      }
      break;
    }

    // ── Chrome ────────────────────────────────────────────────────────────────
    // iPhone Chrome: amber in highlights, teal in shadows, saturated.
    // Classic cross-process-lite look.
    case "chrome": {
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        const l = lumRGB(r, g, b) / 255;
        // Highlight tint: warm amber (+R+G, -B)
        r = clamp(r + l * 20);
        g = clamp(g + l * 10);
        b = clamp(b - l * 16);
        // Shadow tint: teal (+G+B, -R)
        r = clamp(r - (1-l) * 10);
        g = clamp(g + (1-l) * 8);
        b = clamp(b + (1-l) * 16);
        // Saturation + S-curve snap
        let [rr, gg, bb] = satAdj(r, g, b, 1.32);
        data[i]   = sCurve(rr, 0.28);
        data[i+1] = sCurve(gg, 0.28);
        data[i+2] = sCurve(bb, 0.28);
      }
      break;
    }

    // ── Process ───────────────────────────────────────────────────────────────
    // Strong cross-process: cyan-green shadows, warm yellow highlights.
    // High contrast, very "film" aesthetic.
    case "process": {
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        const l = lumRGB(r, g, b) / 255;
        const shadow = 1 - l;
        // Shadows → cyan (reduce red, boost green + blue)
        r = clamp(r - shadow * 26);
        g = clamp(g + shadow * 14);
        b = clamp(b + shadow * 20);
        // Highlights → warm yellow (boost red + green, reduce blue)
        r = clamp(r + l * 22);
        g = clamp(g + l * 14);
        b = clamp(b - l * 24);
        // High saturation + strong contrast
        let [rr, gg, bb] = satAdj(r, g, b, 1.40);
        data[i]   = sCurve(rr, 0.48);
        data[i+1] = sCurve(gg, 0.48);
        data[i+2] = sCurve(bb, 0.48);
      }
      break;
    }

    // ── Fade ──────────────────────────────────────────────────────────────────
    // iPhone Fade: heavy shadow lift (blacks → grey), desaturated, slightly cool.
    case "fade": {
      const lift = 42;
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        // Lift blacks
        r = lift + r * (255 - lift) / 255;
        g = lift + g * (255 - lift) / 255;
        b = lift + b * (255 - lift) / 255;
        // Desaturate
        let [rr, gg, bb] = satAdj(r, g, b, 0.55);
        // Cool blue cast
        data[i]   = clamp(rr);
        data[i+1] = clamp(gg);
        data[i+2] = clamp(bb + 10);
      }
      break;
    }

    // ── Transfer ─────────────────────────────────────────────────────────────
    // iPhone Transfer: warm-paper tone, shadow lift, old photograph feel.
    case "transfer": {
      const lift = 30;
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        // Shadow lift
        r = lift + r * (255 - lift) / 255;
        g = lift + g * (255 - lift) / 255;
        b = lift + b * (255 - lift) / 255;
        // Warm paper split-tone
        const l = lumRGB(r, g, b) / 255;
        r = clamp(r + 14 + l * 8);
        g = clamp(g + 5);
        b = clamp(b - 10 - l * 14);
        // Slight desaturation + gentle S-curve
        let [rr, gg, bb] = satAdj(r, g, b, 0.72);
        data[i]   = sCurve(rr, 0.18);
        data[i+1] = sCurve(gg, 0.18);
        data[i+2] = sCurve(bb, 0.18);
      }
      break;
    }

    // ── Noir ──────────────────────────────────────────────────────────────────
    // iPhone Noir: perceptual luminance grayscale with aggressive S-curve.
    // Much richer than simple greyscale — deep blacks, bright highlights.
    case "noir": {
      for (let i = 0; i < len; i += 4) {
        const l = lumRGB(data[i], data[i+1], data[i+2]);
        const c = sCurve(l, 0.70);
        data[i] = data[i+1] = data[i+2] = c;
      }
      break;
    }

    // ── Cool (Crisp) ─────────────────────────────────────────────────────────
    // iPhone Crisp: clean, cold blue tones, slightly sharp feel.
    case "cool": {
      for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        const l = lumRGB(r, g, b) / 255;
        // Cool: reduce red, boost blue, especially in shadows
        r = clamp(r - 10 - (1-l) * 12);
        b = clamp(b + 14 + (1-l) * 12);
        // Slight desaturation + gentle contrast
        let [rr, gg, bb] = satAdj(r, g, b, 0.86);
        data[i]   = sCurve(rr, 0.22);
        data[i+1] = sCurve(gg, 0.22);
        data[i+2] = sCurve(bb, 0.22);
      }
      break;
    }
  }
}

// ── applyFilterToImage ────────────────────────────────────────────────────────
/**
 * Renders one photo with per-pixel color grading + overlay onto an off-screen
 * canvas and returns a JPEG data-URL.
 * The `css` strings in FILTERS are used ONLY for the live video preview.
 */
export function applyFilterToImage(
  src: string,
  filter: PhotoFilter,
  overlay: OverlayEffect,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Draw raw — no CSS filter
      ctx.drawImage(img, 0, 0);

      if (filter !== "none") {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        gradePixels(imageData.data, canvas.width, canvas.height, filter);
        ctx.putImageData(imageData, 0, 0);

        // Fade & Transfer: baked soft vignette to complete the "old photo" look
        if (filter === "fade" || filter === "transfer") {
          const w = canvas.width, h = canvas.height;
          const vig = ctx.createRadialGradient(w/2, h/2, w*0.20, w/2, h/2, w*0.72);
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, `rgba(0,0,0,${filter === "fade" ? 0.28 : 0.22})`);
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, w, h);
        }
      }

      applyOverlay(ctx, canvas.width, canvas.height, overlay);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.src = src;
  });
}

// ── Overlay effects ───────────────────────────────────────────────────────────
function applyOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  overlay: OverlayEffect,
) {
  switch (overlay) {
    case "hearts": {
      const syms = ["♡", "♥", "❤", "♡", "✿"];
      ctx.font = `${Math.round(w * 0.06)}px serif`;
      ctx.globalAlpha = 0.17;
      ctx.fillStyle = "#e85d8a";
      for (let i = 0; i < 16; i++) {
        const x = (Math.random() * 0.82 + 0.07) * w;
        const y = (Math.random() * 0.82 + 0.07) * h;
        ctx.fillText(syms[i % syms.length], x, y);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "bokeh": {
      const colors = [
        "rgba(255,182,193,0.18)", "rgba(255,218,225,0.15)",
        "rgba(255,160,180,0.14)", "rgba(255,240,245,0.20)",
      ];
      for (let i = 0; i < 22; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const r = (Math.random() * 0.07 + 0.025) * w;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, colors[i % colors.length]);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "grain": {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 38;
        data[i]   = clamp(data[i]   + n);
        data[i+1] = clamp(data[i+1] + n);
        data[i+2] = clamp(data[i+2] + n);
      }
      ctx.putImageData(imageData, 0, 0);
      break;
    }
    case "lightleak": {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0,   "rgba(255,120,50,0.15)");
      grad.addColorStop(0.3, "rgba(255,200,50,0.08)");
      grad.addColorStop(0.6, "rgba(255,100,150,0.12)");
      grad.addColorStop(1,   "rgba(255,80,30,0.10)");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      const radial = ctx.createRadialGradient(w*0.8, h*0.2, 0, w*0.8, h*0.2, w*0.5);
      radial.addColorStop(0, "rgba(255,200,100,0.20)");
      radial.addColorStop(1, "rgba(255,200,100,0)");
      ctx.fillStyle = radial; ctx.fillRect(0, 0, w, h);
      break;
    }
    case "dust": {
      ctx.fillStyle = "rgba(200,180,160,0.04)"; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(180,160,140,${Math.random() * 0.3 + 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random()*w, Math.random()*h, Math.random()*2+0.5, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(200,180,150,0.08)"; ctx.lineWidth = 0.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random()*w, 0); ctx.lineTo(Math.random()*w, h); ctx.stroke();
      }
      break;
    }
    case "vignette": {
      const v = ctx.createRadialGradient(w/2, h/2, w*0.25, w/2, h/2, w*0.7);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}
