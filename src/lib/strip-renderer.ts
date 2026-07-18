import {
  type FrameStyle,
  type BoothSettings,
  applyFilterToImage,
} from "@/lib/booth-settings";

const PHOTOS_COUNT = 4;

// ── Base photo cell dimensions (portrait 3:4) ─────────────────────────────────
// At scale=1 (preview): 300×400 — same as before, watermarked.
// At scale=3 (HD export): 900×1200 per cell — genuinely high-resolution.
const PHOTO_W = 300;
const PHOTO_H = 400;

// ── Public API ────────────────────────────────────────────────────────────────

export interface StripRenderOptions {
  /** 1 = preview/watermarked, 3 = HD export. Default: 1 */
  scale?: number;
  /** Draw the @the.keepsakebooth watermark tile. Default: true */
  watermark?: boolean;
}

/**
 * Render a complete photostrip onto `canvas`.
 *
 * Preview (default):  scale=1, watermark=true  → 300×400/cell, branded
 * HD export:          scale=3, watermark=false → 900×1200/cell, clean
 */
export async function renderPhotostrip(
  canvas: HTMLCanvasElement,
  photos: string[],
  settings: BoothSettings,
  options: StripRenderOptions = {},
): Promise<void> {
  const { scale = 1, watermark = true } = options;

  const processedPhotos = await Promise.all(
    photos.map((src) => applyFilterToImage(src, settings.filter, settings.overlay)),
  );

  const ctx = canvas.getContext("2d")!;
  const frameRenderer = FRAME_RENDERERS[settings.frame];
  await frameRenderer(canvas, ctx, processedPhotos, settings.caption, scale);

  if (watermark) {
    drawWatermark(ctx, canvas.width, canvas.height);
  }
}

// ── Watermark ─────────────────────────────────────────────────────────────────

/**
 * Tiles a diagonal semi-transparent "@the.keepsakebooth" watermark
 * across the entire canvas.
 * - Free preview deterrent: makes screenshots less shareable without credit
 * - Doubles as free brand exposure on any shared images
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const text = "♡ @the.keepsakebooth";
  // Font size scales with canvas width; min 12px so it's always visible
  const fontSize = Math.max(12, Math.round(w * 0.044));

  ctx.save();

  ctx.font = `${fontSize}px 'Patrick Hand', cursive, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // White text with a thin dark outline for legibility on any background
  ctx.lineWidth = fontSize * 0.18;
  ctx.strokeStyle = "rgba(20, 5, 10, 0.20)";
  ctx.fillStyle   = "rgba(255, 255, 255, 0.38)";

  // Rotate the entire coordinate system
  const angle = -Math.PI / 5.5; // ≈ −33°
  const stepX  = fontSize * 9.5;
  const stepY  = fontSize * 3.8;

  // We need to tile over the full canvas diagonal
  const diagLen = Math.sqrt(w * w + h * h);
  const cols = Math.ceil(diagLen / stepX) + 3;
  const rows = Math.ceil(diagLen / stepY) + 3;

  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  ctx.translate(-diagLen / 2, -diagLen / 2);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * stepX + (row % 2) * (stepX / 2);
      const y = row * stepY;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

// ── Internals ─────────────────────────────────────────────────────────────────

type FrameRenderer = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  photos: string[],
  caption: string,
  scale: number,
) => Promise<void>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

/**
 * Cover-fits an image into a cell rectangle, clipping to the cell boundary.
 * This handles aspect-ratio mismatches gracefully — no black bars, no stretch.
 */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
) {
  const imgRatio  = img.naturalWidth  / img.naturalHeight;
  const cellRatio = cellW / cellH;

  let drawW = cellW, drawH = cellH, drawX = cellX, drawY = cellY;

  if (imgRatio > cellRatio) {
    // Image wider — fit by height, crop sides
    drawW = cellH * imgRatio;
    drawX = cellX - (drawW - cellW) / 2;
  } else {
    // Image taller — fit by width, crop top/bottom
    drawH = cellW / imgRatio;
    drawY = cellY - (drawH - cellH) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(cellX, cellY, cellW, cellH);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

// ── Frame renderers ───────────────────────────────────────────────────────────

const FRAME_RENDERERS: Record<FrameStyle, FrameRenderer> = {

  // ── Classic ────────────────────────────────────────────────────────────────
  classic: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 16*S, gap = 8*S;
    const capH = caption ? 50*S : 30*S;
    const totalH = pad*2 + PHOTOS_COUNT*pH + (PHOTOS_COUNT-1)*gap + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2d3648"; ctx.lineWidth = 2*S;
    ctx.strokeRect(S, S, canvas.width - 2*S, canvas.height - 2*S);

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      ctx.strokeStyle = "#c0c5d0"; ctx.lineWidth = S;
      ctx.strokeRect(pad-S, y-S, pW+2*S, pH+2*S);
      drawPhoto(ctx, img, pad, y, pW, pH);
    }

    ctx.fillStyle = "#2d3648";
    ctx.font = `${16*S}px 'Patrick Hand', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "mysketchbooth ✿", canvas.width/2, totalH - 12*S);
  },

  // ── Polaroid ────────────────────────────────────────────────────────────────
  polaroid: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S;
    const padSide = 30*S, padTop = 25*S, padBot = 70*S, gap = 15*S;
    const totalH = padTop + PHOTOS_COUNT*(pH+gap) - gap + padBot;
    canvas.width = pW + padSide*2; canvas.height = totalH;

    ctx.fillStyle = "#faf8f4"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 15*S;
    ctx.shadowOffsetX = 3*S; ctx.shadowOffsetY = 3*S;
    ctx.fillStyle = "#faf8f4"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = "transparent";

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      drawPhoto(ctx, img, padSide, padTop + i*(pH+gap), pW, pH);
    }

    ctx.fillStyle = "#4a4a4a";
    ctx.font = `italic ${20*S}px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "✿ memories ✿", canvas.width/2, totalH - 25*S);
  },

  // ── Filmstrip ───────────────────────────────────────────────────────────────
  filmstrip: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 35*S, gap = 6*S;
    const spkSize = 12*S, spkGap = 20*S, capH = 40*S;
    const totalH = pad + PHOTOS_COUNT*(pH+gap) - gap + pad + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2a2a2a";
    const numSpk = Math.floor(totalH / spkGap);
    for (let i = 0; i < numSpk; i++) {
      const y = 10*S + i*spkGap;
      ctx.beginPath(); ctx.roundRect(6*S, y, spkSize, spkSize*0.7, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(canvas.width-6*S-spkSize, y, spkSize, spkSize*0.7, 2); ctx.fill();
    }

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      drawPhoto(ctx, img, pad, y, pW, pH);
    }

    ctx.fillStyle = "#ff8c00";
    ctx.font = `${12*S}px monospace`;
    ctx.textAlign = "left";
    for (let i = 0; i < photos.length; i++) {
      ctx.fillText(`${i+1}A`, pad+4*S, pad+i*(pH+gap)+pH-4*S);
    }

    ctx.fillStyle = "#cccccc";
    ctx.font = `${16*S}px 'Patrick Hand', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "35mm ✦ mysketchbooth", canvas.width/2, totalH - 15*S);
  },

  // ── Floral ──────────────────────────────────────────────────────────────────
  floral: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 30*S, gap = 12*S, capH = 55*S;
    const totalH = pad + PHOTOS_COUNT*(pH+gap) - gap + pad + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#fdf6ee"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#7a6b5d"; ctx.lineWidth = 1.5*S;
    ctx.setLineDash([4*S, 4*S]);
    ctx.strokeRect(8*S, 8*S, canvas.width-16*S, canvas.height-16*S);
    ctx.setLineDash([]);

    const drawFlower = (x: number, y: number, sz: number) => {
      ctx.strokeStyle = "#9b8b7a"; ctx.lineWidth = 1.2*S;
      for (let j = 0; j < 5; j++) {
        const a = (j*Math.PI*2)/5;
        ctx.beginPath();
        ctx.ellipse(x+Math.cos(a)*sz*0.5, y+Math.sin(a)*sz*0.5, sz*0.4, sz*0.25, a, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, sz*0.2, 0, Math.PI*2);
      ctx.fillStyle = "#c4a882"; ctx.fill();
    };

    const f = 14*S;
    drawFlower(24*S, 24*S, f); drawFlower(canvas.width-24*S, 24*S, f);
    drawFlower(24*S, canvas.height-24*S, f); drawFlower(canvas.width-24*S, canvas.height-24*S, f);

    ctx.strokeStyle = "#a89880"; ctx.lineWidth = S;
    for (let i = 0; i < 8; i++) {
      const x = 20*S + (i*(canvas.width-40*S))/7;
      ctx.beginPath(); ctx.arc(x, 16*S, 3*S, 0, Math.PI, true); ctx.stroke();
    }

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      ctx.strokeStyle = "#d4c5b2"; ctx.lineWidth = S;
      ctx.strokeRect(pad-S, y-S, pW+2*S, pH+2*S);
      drawPhoto(ctx, img, pad, y, pW, pH);
    }

    ctx.fillStyle = "#7a6b5d";
    ctx.font = `${18*S}px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "✿ with love ✿", canvas.width/2, totalH - 20*S);
  },

  // ── Torn ────────────────────────────────────────────────────────────────────
  torn: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 22*S, gap = 10*S, capH = 45*S;
    const totalH = pad + PHOTOS_COUNT*(pH+gap) - gap + pad + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#f5f0e8"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(180,170,155,${Math.random()*0.05})`;
      ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2*S, 2*S);
    }

    // Torn top edge
    ctx.fillStyle = "hsl(220,14%,94%)";
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let x = 0; x <= canvas.width; x += 3*S) ctx.lineTo(x, Math.random()*5*S+S);
    ctx.lineTo(canvas.width, 0); ctx.closePath(); ctx.fill();

    // Torn bottom edge
    ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 3*S) ctx.lineTo(x, canvas.height-Math.random()*5*S-S);
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill();

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      ctx.save();
      const rot = (Math.random()-0.5)*0.015;
      ctx.translate(pad+pW/2, y+pH/2); ctx.rotate(rot);
      drawPhoto(ctx, img, -pW/2, -pH/2, pW, pH);
      ctx.restore();
    }

    ctx.fillStyle = "#6b5e50";
    ctx.font = `${17*S}px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "torn from time ✦", canvas.width/2, totalH - 15*S);
  },

  // ── 💕 Hearts ───────────────────────────────────────────────────────────────
  hearts: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 20*S, gap = 10*S, capH = 60*S;
    const totalH = pad*2 + PHOTOS_COUNT*pH + (PHOTOS_COUNT-1)*gap + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#fff0f3"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texture
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(230,160,175,${Math.random()*0.04})`;
      ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2*S, 2*S);
    }

    // Outer rose border
    ctx.strokeStyle = "#c4687a"; ctx.lineWidth = 2.5*S;
    ctx.strokeRect(3*S, 3*S, canvas.width-6*S, canvas.height-6*S);

    // Inner dashed border
    ctx.strokeStyle = "#e8a0b0"; ctx.lineWidth = S;
    ctx.setLineDash([5*S, 5*S]);
    ctx.strokeRect(9*S, 9*S, canvas.width-18*S, canvas.height-18*S);
    ctx.setLineDash([]);

    // Corner hearts
    const drawHeart = (cx: number, cy: number, sz: number) => {
      ctx.save(); ctx.translate(cx, cy);
      ctx.fillStyle = "#e07090"; ctx.beginPath();
      ctx.moveTo(0, sz*0.3);
      ctx.bezierCurveTo(sz*0.5, -sz*0.3, sz, sz*0.1, 0, sz);
      ctx.bezierCurveTo(-sz, sz*0.1, -sz*0.5, -sz*0.3, 0, sz*0.3);
      ctx.fill(); ctx.restore();
    };
    const hs = 7*S;
    drawHeart(pad/2, pad/2, hs); drawHeart(canvas.width-pad/2, pad/2, hs);
    drawHeart(pad/2, canvas.height-pad/2-hs*2, hs);
    drawHeart(canvas.width-pad/2, canvas.height-pad/2-hs*2, hs);

    // Border hearts
    const bhSyms = ["♡","♥","♡","♥","♡"];
    ctx.fillStyle = "#d4788a"; ctx.font = `${10*S}px serif`; ctx.textAlign = "center";
    for (let i = 0; i < 5; i++) {
      const x = (canvas.width/6)*(i+0.5)+10*S;
      ctx.fillText(bhSyms[i], x, 18*S);
      ctx.fillText(bhSyms[i], x, canvas.height-8*S);
    }

    // Photos
    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      ctx.strokeStyle = "#e8a8b8"; ctx.lineWidth = 1.5*S;
      ctx.strokeRect(pad-S, y-S, pW+2*S, pH+2*S);
      drawPhoto(ctx, img, pad, y, pW, pH);
    }

    ctx.fillStyle = "#b05068";
    ctx.font = `italic bold ${22*S}px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "♡ us, always ♡", canvas.width/2, totalH - 22*S);

    ctx.fillStyle = "#e07090";
    ctx.font = `${11*S}px serif`;
    ctx.fillText("♥  ♡  ♥", canvas.width/2, totalH - 8*S);
  },

  // ── 🎞 Love Film ─────────────────────────────────────────────────────────────
  lovefilm: async (canvas, ctx, photos, caption, S) => {
    const pW = PHOTO_W*S, pH = PHOTO_H*S, pad = 32*S, gap = 6*S;
    const spkH = 10*S, spkW = 8*S, spkGap = 18*S, capH = 48*S;
    const totalH = pad + PHOTOS_COUNT*(pH+gap) - gap + pad + capH;
    canvas.width = pW + pad*2; canvas.height = totalH;

    ctx.fillStyle = "#1a0a0e"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grain
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = `rgba(255,180,180,${Math.random()*0.03})`;
      ctx.lineWidth = S;
      ctx.beginPath();
      ctx.moveTo(Math.random()*canvas.width, 0); ctx.lineTo(Math.random()*canvas.width, canvas.height); ctx.stroke();
    }

    // Rose sprockets
    const numSpk = Math.floor(totalH / spkGap);
    for (let i = 0; i < numSpk; i++) {
      const y = 8*S + i*spkGap;
      ctx.fillStyle = "#3a1820";
      ctx.beginPath(); ctx.roundRect(5*S, y, spkW, spkH, 2); ctx.fill();
      ctx.strokeStyle = "#c4687a"; ctx.lineWidth = 0.5*S; ctx.strokeRect(5*S, y, spkW, spkH);
      ctx.fillStyle = "#3a1820";
      ctx.beginPath(); ctx.roundRect(canvas.width-5*S-spkW, y, spkW, spkH, 2); ctx.fill();
      ctx.strokeStyle = "#c4687a"; ctx.strokeRect(canvas.width-5*S-spkW, y, spkW, spkH);
    }

    // Photos
    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = pad + i*(pH+gap);
      ctx.strokeStyle = "#c4687a"; ctx.lineWidth = S;
      ctx.strokeRect(pad-S, y-S, pW+2*S, pH+2*S);
      drawPhoto(ctx, img, pad, y, pW, pH);
      ctx.fillStyle = "#e8a0b0"; ctx.font = `${10*S}px monospace`; ctx.textAlign = "left";
      ctx.fillText(`${i+1}♡`, pad+4*S, y+pH-4*S);
    }

    ctx.fillStyle = "#f0a0b8";
    ctx.font = `italic bold ${20*S}px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "♡ captured in love ♡", canvas.width/2, totalH - 20*S);

    ctx.strokeStyle = "#c4687a"; ctx.lineWidth = 0.5*S;
    const capY = totalH - capH + 6*S;
    ctx.beginPath(); ctx.moveTo(pad, capY); ctx.lineTo(canvas.width-pad, capY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, totalH-6*S); ctx.lineTo(canvas.width-pad, totalH-6*S); ctx.stroke();
  },
};
