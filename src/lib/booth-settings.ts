export type PhotoFilter = "none" | "sepia" | "bw" | "warm" | "faded" | "cool" | "rosy";
export type FrameStyle = "classic" | "polaroid" | "filmstrip" | "floral" | "torn" | "hearts" | "lovefilm";
export type OverlayEffect = "none" | "grain" | "lightleak" | "dust" | "vignette" | "hearts" | "bokeh";

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

export const FILTERS: { id: PhotoFilter; label: string; css: string }[] = [
  { id: "none",  label: "Original",   css: "" },
  { id: "rosy",  label: "Rosy 🌹",    css: "saturate(1.2) brightness(1.05) hue-rotate(-15deg) contrast(1.05)" },
  { id: "warm",  label: "Warm",       css: "sepia(0.25) saturate(1.3) brightness(1.05) hue-rotate(-10deg)" },
  { id: "sepia", label: "Sepia",      css: "sepia(0.7) contrast(1.1) brightness(0.95)" },
  { id: "faded", label: "Faded Film", css: "saturate(0.6) contrast(0.85) brightness(1.1)" },
  { id: "bw",    label: "B&W",        css: "grayscale(1) contrast(1.2)" },
  { id: "cool",  label: "Cool Tone",  css: "saturate(0.8) brightness(1.05) hue-rotate(15deg)" },
];

export const FRAMES: { id: FrameStyle; label: string; emoji: string }[] = [
  { id: "hearts",   label: "Hearts",       emoji: "🤍" },
  { id: "lovefilm", label: "Love Film",    emoji: "🎞" },
  { id: "classic",  label: "Classic",      emoji: "▪" },
  { id: "polaroid", label: "Polaroid",     emoji: "📷" },
  { id: "filmstrip",label: "Film Strip",   emoji: "🎞" },
  { id: "floral",   label: "Floral",       emoji: "✿" },
  { id: "torn",     label: "Torn Paper",   emoji: "📜" },
];

export const OVERLAYS: { id: OverlayEffect; label: string }[] = [
  { id: "none",      label: "None" },
  { id: "hearts",    label: "Hearts ♡" },
  { id: "bokeh",     label: "Bokeh ✨" },
  { id: "grain",     label: "Film Grain" },
  { id: "lightleak", label: "Light Leak" },
  { id: "vignette",  label: "Vignette" },
  { id: "dust",      label: "Dust & Scratches" },
];

/** Apply filter + overlay to a photo and return data URL */
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

      // Apply CSS filter
      const filterDef = FILTERS.find((f) => f.id === filter);
      if (filterDef?.css) ctx.filter = filterDef.css;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";

      // Apply overlay
      applyOverlay(ctx, canvas.width, canvas.height, overlay);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.src = src;
  });
}

function applyOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  overlay: OverlayEffect,
) {
  switch (overlay) {
    case "hearts": {
      // Scatter small translucent hearts across the photo
      const heartSymbols = ["♡", "♥", "❤", "♡", "✿"];
      ctx.font = `${Math.round(w * 0.06)}px serif`;
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#e85d8a";
      const count = 16;
      for (let i = 0; i < count; i++) {
        const x = (Math.random() * 0.85 + 0.07) * w;
        const y = (Math.random() * 0.85 + 0.07) * h;
        ctx.fillText(heartSymbols[i % heartSymbols.length], x, y);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "bokeh": {
      // Soft glowing circles — romantic out-of-focus lights
      const colors = [
        "rgba(255, 182, 193, 0.18)",
        "rgba(255, 218, 225, 0.15)",
        "rgba(255, 160, 180, 0.14)",
        "rgba(255, 240, 245, 0.20)",
      ];
      for (let i = 0; i < 22; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = (Math.random() * 0.07 + 0.025) * w;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, colors[i % colors.length]);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "grain": {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 38;
        data[i] += noise; data[i + 1] += noise; data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
      break;
    }
    case "lightleak": {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0,   "rgba(255, 120, 50, 0.15)");
      gradient.addColorStop(0.3, "rgba(255, 200, 50, 0.08)");
      gradient.addColorStop(0.6, "rgba(255, 100, 150, 0.12)");
      gradient.addColorStop(1,   "rgba(255, 80, 30, 0.1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      const radial = ctx.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, w * 0.5);
      radial.addColorStop(0, "rgba(255, 200, 100, 0.2)");
      radial.addColorStop(1, "rgba(255, 200, 100, 0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "dust": {
      ctx.fillStyle = "rgba(200, 180, 160, 0.04)";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(180, 160, 140, ${Math.random() * 0.3 + 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(200, 180, 150, 0.08)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, 0);
        ctx.lineTo(Math.random() * w, h);
        ctx.stroke();
      }
      break;
    }
    case "vignette": {
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}
