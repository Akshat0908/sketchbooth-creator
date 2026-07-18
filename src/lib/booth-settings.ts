// ── Type definitions ─────────────────────────────────────────────────────────
export type PhotoFilter =
  | "none" | "rosy" | "warm" | "sepia" | "faded" | "bw" | "cool"
  | "goldenHour" | "polaroidFade";

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
  filter: "rosy",
  frame: "hearts",
  overlay: "none",
  caption: "",
};

// ── Filters ───────────────────────────────────────────────────────────────────
// `css` is used ONLY for the live video preview (real-time, must be fast).
// `applyFilterToImage` uses per-pixel color grading for final renders.
export const FILTERS: { id: PhotoFilter; label: string; css: string }[] = [
  { id: "none",         label: "Original",      css: "" },
  { id: "rosy",         label: "Rosy 🌹",       css: "saturate(1.2) brightness(1.05) hue-rotate(-15deg)" },
  { id: "warm",         label: "Warm",           css: "sepia(0.25) saturate(1.3) brightness(1.05) hue-rotate(-10deg)" },
  { id: "goldenHour",   label: "Golden Hour ☀️", css: "sepia(0.15) saturate(1.4) brightness(1.1) hue-rotate(-5deg)" },
  { id: "sepia",        label: "Sepia",          css: "sepia(0.7) contrast(1.1) brightness(0.95)" },
  { id: "faded",        label: "Faded Film",     css: "saturate(0.6) contrast(0.85) brightness(1.1)" },
  { id: "polaroidFade", label: "Polaroid 📷",    css: "saturate(0.5) contrast(0.8) brightness(1.15)" },
  { id: "bw",           label: "B&W",            css: "grayscale(1) contrast(1.2)" },
  { id: "cool",         label: "Cool Tone",      css: "saturate(0.8) brightness(1.05) hue-rotate(15deg)" },
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

// ── Per-pixel helpers ─────────────────────────────────────────────────────────
const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

function gradePixels(data: Uint8ClampedArray, w: number, h: number, filter: PhotoFilter) {
  const len = data.length;

  if (filter === "sepia") {
    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Classic sepia matrix, blended at 85% intensity
      const tr = r * 0.393 + g * 0.769 + b * 0.189;
      const tg = r * 0.349 + g * 0.686 + b * 0.168;
      const tb = r * 0.272 + g * 0.534 + b * 0.131;
      // Slight contrast lift
      data[i]     = clamp((r + (tr - r) * 0.85 - 128) * 1.08 + 128);
      data[i + 1] = clamp((g + (tg - g) * 0.85 - 128) * 1.08 + 128);
      data[i + 2] = clamp((b + (tb - b) * 0.85 - 128) * 1.08 + 128);
    }
    return;
  }

  if (filter === "bw") {
    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Photographic luminosity weights + mild S-curve
      let lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
      lum = clamp((lum - 128) * 1.18 + 128);
      data[i] = data[i + 1] = data[i + 2] = lum;
    }
    return;
  }

  if (filter === "warm") {
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      const lumN = (r * 0.299 + g * 0.587 + b * 0.114) / 255; // 0–1
      const shadow = 1 - lumN;
      // Split-tone: warm shadows (orange push), cool-neutral highlights
      r = clamp(r + shadow * 14 + lumN * 8);
      g = clamp(g + shadow * 5  + lumN * 3);
      b = clamp(b - shadow * 10);
      // Saturation boost
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      data[i]     = clamp(gray + (r - gray) * 1.22);
      data[i + 1] = clamp(gray + (g - gray) * 1.22);
      data[i + 2] = clamp(gray + (b - gray) * 1.22);
    }
    return;
  }

  if (filter === "faded") {
    const lift = 28;
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      // Lifted blacks
      r = lift + r * (255 - lift) / 255;
      g = lift + g * (255 - lift) / 255;
      b = lift + b * (255 - lift) / 255;
      // Reduce saturation
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * 0.62;
      g = gray + (g - gray) * 0.62;
      b = gray + (b - gray) * 0.62;
      // Slight cool shadow tint (faded film blue)
      const lumN = (r + g + b) / 3 / 255;
      data[i]     = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b + (1 - lumN) * 8);
    }
    return;
  }

  if (filter === "cool") {
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      const lumN = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      // Cool shadow push: reduce red, boost blue
      r = clamp(r - (1 - lumN) * 12);
      b = clamp(b + (1 - lumN) * 14 + 6);
      // Slight desaturation
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      data[i]     = clamp(gray + (r - gray) * 0.82);
      data[i + 1] = clamp(gray + (g - gray) * 0.82);
      data[i + 2] = clamp(gray + (b - gray) * 0.82);
    }
    return;
  }

  if (filter === "rosy") {
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      // Boost reds and pinks, slight brightness
      r = clamp(r * 1.09 + 6);
      b = clamp(b * 1.04 + 4);
      g = clamp(g + 4);
      // Saturation boost
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      data[i]     = clamp(gray + (r - gray) * 1.20);
      data[i + 1] = clamp(gray + (g - gray) * 1.20);
      data[i + 2] = clamp(gray + (b - gray) * 1.20);
    }
    return;
  }

  if (filter === "goldenHour") {
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      const lumN = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
      // Strong warm tint everywhere
      r = clamp(r * 1.13 + 18);
      g = clamp(g * 1.04 + 6);
      b = clamp(b * 0.85 - 10);
      // Extra highlight glow (warm yellow)
      if (lumN > 0.5) {
        const h = (lumN - 0.5) * 2;
        r = clamp(r + h * 20);
        g = clamp(g + h * 10);
      }
      // Warm shadow push
      if (lumN < 0.45) {
        const s = (0.45 - lumN) / 0.45;
        r = clamp(r + s * 10);
        b = clamp(b - s * 6);
      }
      // Saturation boost
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      data[i]     = clamp(gray + (r - gray) * 1.18);
      data[i + 1] = clamp(gray + (g - gray) * 1.18);
      data[i + 2] = clamp(gray + (b - gray) * 1.18);
    }
    return;
  }

  if (filter === "polaroidFade") {
    const lift = 38;
    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      // Strong shadow lift (classic Polaroid)
      r = lift + r * (255 - lift) / 255;
      g = lift + g * (255 - lift) / 255;
      b = lift + b * (255 - lift) / 255;
      // Heavy desaturation
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * 0.50;
      g = gray + (g - gray) * 0.50;
      b = gray + (b - gray) * 0.50;
      // Blue shadow tint (Polaroid characteristic)
      const lumN = (r + g + b) / 3 / 255;
      b = b + (1 - lumN) * 16;
      r = r - (1 - lumN) * 5;
      data[i]     = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b);
    }
    // Baked soft vignette applied in applyFilterToImage after putImageData
    void w; void h; // used by caller
    return;
  }
}

// ── applyFilterToImage ────────────────────────────────────────────────────────
/**
 * Applies per-pixel color grading (for final render quality) + overlay.
 * The live preview in Booth.tsx uses the `css` strings instead for performance.
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

      // Draw raw — no CSS filter. Per-pixel grading applied below.
      ctx.drawImage(img, 0, 0);

      // Per-pixel color grading (skipped for 'none')
      if (filter !== "none") {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        gradePixels(imageData.data, canvas.width, canvas.height, filter);
        ctx.putImageData(imageData, 0, 0);

        // polaroidFade: baked soft vignette as a canvas overlay
        if (filter === "polaroidFade") {
          const w = canvas.width, h = canvas.height;
          const vignette = ctx.createRadialGradient(w/2, h/2, w*0.18, w/2, h/2, w*0.72);
          vignette.addColorStop(0, "rgba(0,0,0,0)");
          vignette.addColorStop(1, "rgba(0,0,0,0.36)");
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Apply overlay
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
        data[i] = clamp(data[i] + n);
        data[i + 1] = clamp(data[i + 1] + n);
        data[i + 2] = clamp(data[i + 2] + n);
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
