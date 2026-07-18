import {
  type FrameStyle,
  type BoothSettings,
  applyFilterToImage,
} from "@/lib/booth-settings";

const PHOTOS_COUNT = 4;

// ── Photo cell dimensions (portrait 3:4) ─────────────────────────────────────
// Each photo slot is portrait-oriented so selfies fill the frame naturally.
// photoH / photoW ≈ 1.33  (3:4 ratio)
const PHOTO_W = 300;
const PHOTO_H = 400;  // was 225 (landscape) — now 400 (portrait 3:4)

/** Draw a complete photostrip to a canvas with frame, filter, overlay, and caption */
export async function renderPhotostrip(
  canvas: HTMLCanvasElement,
  photos: string[],
  settings: BoothSettings,
): Promise<void> {
  // First, apply filters to all photos
  const processedPhotos = await Promise.all(
    photos.map((src) => applyFilterToImage(src, settings.filter, settings.overlay)),
  );

  const ctx = canvas.getContext("2d")!;
  const frameRenderer = FRAME_RENDERERS[settings.frame];
  await frameRenderer(canvas, ctx, processedPhotos, settings.caption);
}

type FrameRenderer = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  photos: string[],
  caption: string,
) => Promise<void>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

/**
 * drawPhoto — centre-fits an image into a rectangle, preserving aspect ratio.
 * This prevents stretching when the captured photo's ratio doesn't exactly
 * match the cell ratio (e.g. slight orientation differences across devices).
 */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const cellRatio = cellW / cellH;

  let drawW = cellW, drawH = cellH, drawX = cellX, drawY = cellY;

  if (imgRatio > cellRatio) {
    // Image is wider — fit by height, crop sides
    drawW = cellH * imgRatio;
    drawX = cellX - (drawW - cellW) / 2;
  } else {
    // Image is taller — fit by width, crop top/bottom
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

const FRAME_RENDERERS: Record<FrameStyle, FrameRenderer> = {
  classic: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 16, gap = 8;
    const captionH = caption ? 50 : 30;
    const totalH = padding * 2 + PHOTOS_COUNT * photoH + (PHOTOS_COUNT - 1) * gap + captionH;
    canvas.width = photoW + padding * 2;
    canvas.height = totalH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2d3648";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      ctx.strokeStyle = "#c0c5d0";
      ctx.lineWidth = 1;
      ctx.strokeRect(padding - 1, y - 1, photoW + 2, photoH + 2);
      drawPhoto(ctx, img, padding, y, photoW, photoH);
    }

    ctx.fillStyle = "#2d3648";
    ctx.font = "16px 'Patrick Hand', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "mysketchbooth ✿", canvas.width / 2, totalH - 12);
  },

  polaroid: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, paddingSide = 30, paddingTop = 25, paddingBottom = 70, gap = 15;
    const totalH = paddingTop + PHOTOS_COUNT * (photoH + gap) - gap + paddingBottom;
    canvas.width = photoW + paddingSide * 2;
    canvas.height = totalH;

    // Cream background
    ctx.fillStyle = "#faf8f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft shadow border
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#faf8f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = "transparent";

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = paddingTop + i * (photoH + gap);
      drawPhoto(ctx, img, paddingSide, y, photoW, photoH);
    }

    // Handwritten caption at bottom
    ctx.fillStyle = "#4a4a4a";
    ctx.font = "italic 20px 'Caveat', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "✿ memories ✿", canvas.width / 2, totalH - 25);
  },

  filmstrip: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 35, gap = 6;
    const sprocketSize = 12, sprocketGap = 20;
    const captionH = 40;
    const totalH = padding + PHOTOS_COUNT * (photoH + gap) - gap + padding + captionH;
    canvas.width = photoW + padding * 2;
    canvas.height = totalH;

    // Dark film background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sprocket holes on both sides
    ctx.fillStyle = "#2a2a2a";
    const numSprockets = Math.floor(totalH / sprocketGap);
    for (let i = 0; i < numSprockets; i++) {
      const y = 10 + i * sprocketGap;
      // Left sprockets
      ctx.beginPath();
      ctx.roundRect(6, y, sprocketSize, sprocketSize * 0.7, 2);
      ctx.fill();
      // Right sprockets
      ctx.beginPath();
      ctx.roundRect(canvas.width - 6 - sprocketSize, y, sprocketSize, sprocketSize * 0.7, 2);
      ctx.fill();
    }

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      drawPhoto(ctx, img, padding, y, photoW, photoH);
    }

    // Frame number text
    ctx.fillStyle = "#ff8c00";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    for (let i = 0; i < photos.length; i++) {
      const y = padding + i * (photoH + gap);
      ctx.fillText(`${i + 1}A`, padding + 4, y + photoH - 4);
    }

    // Caption
    ctx.fillStyle = "#cccccc";
    ctx.font = "16px 'Patrick Hand', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "35mm ✦ mysketchbooth", canvas.width / 2, totalH - 15);
  },

  floral: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 30, gap = 12;
    const captionH = 55;
    const totalH = padding + PHOTOS_COUNT * (photoH + gap) - gap + padding + captionH;
    canvas.width = photoW + padding * 2;
    canvas.height = totalH;

    // Warm cream
    ctx.fillStyle = "#fdf6ee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Doodle border
    ctx.strokeStyle = "#7a6b5d";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.setLineDash([]);

    // Corner flowers
    const drawFlower = (x: number, y: number, size: number) => {
      ctx.strokeStyle = "#9b8b7a";
      ctx.lineWidth = 1.2;
      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(angle) * size * 0.5,
          y + Math.sin(angle) * size * 0.5,
          size * 0.4, size * 0.25, angle, 0, Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#c4a882";
      ctx.fill();
    };

    drawFlower(24, 24, 14);
    drawFlower(canvas.width - 24, 24, 14);
    drawFlower(24, canvas.height - 24, 14);
    drawFlower(canvas.width - 24, canvas.height - 24, 14);

    // Vine along edges
    ctx.strokeStyle = "#a89880";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x = 20 + (i * (canvas.width - 40)) / 7;
      ctx.beginPath();
      ctx.arc(x, 16, 3, 0, Math.PI, true);
      ctx.stroke();
    }

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      // Soft border
      ctx.strokeStyle = "#d4c5b2";
      ctx.lineWidth = 1;
      ctx.strokeRect(padding - 1, y - 1, photoW + 2, photoH + 2);
      drawPhoto(ctx, img, padding, y, photoW, photoH);
    }

    ctx.fillStyle = "#7a6b5d";
    ctx.font = "18px 'Caveat', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "✿ with love ✿", canvas.width / 2, totalH - 20);
  },

  torn: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 22, gap = 10;
    const captionH = 45;
    const totalH = padding + PHOTOS_COUNT * (photoH + gap) - gap + padding + captionH;
    canvas.width = photoW + padding * 2;
    canvas.height = totalH;

    // Off-white paper
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paper texture - subtle noise
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(180, 170, 155, ${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Torn edge effect (jagged top and bottom)
    ctx.fillStyle = "hsl(220, 14%, 94%)"; // background color to "tear" into
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= canvas.width; x += 3) {
      ctx.lineTo(x, Math.random() * 5 + 1);
    }
    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 3) {
      ctx.lineTo(x, canvas.height - Math.random() * 5 - 1);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      ctx.save();
      // Slight rotation for organic feel
      const rot = (Math.random() - 0.5) * 0.015;
      ctx.translate(padding + photoW / 2, y + photoH / 2);
      ctx.rotate(rot);
      drawPhoto(ctx, img, -photoW / 2, -photoH / 2, photoW, photoH);
      ctx.restore();
    }

    ctx.fillStyle = "#6b5e50";
    ctx.font = "17px 'Caveat', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "torn from time ✦", canvas.width / 2, totalH - 15);
  },

  // ── 💕 Hearts frame ─────────────────────────────────────────────────────
  hearts: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 20, gap = 10;
    const captionH = 60;
    const totalH = padding * 2 + PHOTOS_COUNT * photoH + (PHOTOS_COUNT - 1) * gap + captionH;
    canvas.width  = photoW + padding * 2;
    canvas.height = totalH;

    // Soft blush background
    ctx.fillStyle = "#fff0f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle pink paper texture
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(230, 160, 175, ${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Outer border — rose
    ctx.strokeStyle = "#c4687a";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    // Inner dashed border
    ctx.strokeStyle = "#e8a0b0";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
    ctx.setLineDash([]);

    // Draw heart at each corner
    const drawHeart = (cx: number, cy: number, size: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "#e07090";
      ctx.beginPath();
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo( size * 0.5, -size * 0.3,  size, size * 0.1,  0, size);
      ctx.bezierCurveTo(-size,       size * 0.1, -size * 0.5, -size * 0.3, 0, size * 0.3);
      ctx.fill();
      ctx.restore();
    };
    const hs = 7;
    drawHeart(padding / 2, padding / 2, hs);
    drawHeart(canvas.width - padding / 2, padding / 2, hs);
    drawHeart(padding / 2, canvas.height - padding / 2 - hs * 2, hs);
    drawHeart(canvas.width - padding / 2, canvas.height - padding / 2 - hs * 2, hs);

    // Small scattered hearts along top and bottom edges
    const borderHearts = ["♡", "♥", "♡", "♥", "♡"];
    ctx.fillStyle = "#d4788a";
    ctx.font = "10px serif";
    ctx.textAlign = "center";
    for (let i = 0; i < 5; i++) {
      const x = (canvas.width / 6) * (i + 0.5) + 10;
      ctx.fillText(borderHearts[i], x, 18);
      ctx.fillText(borderHearts[i], x, canvas.height - 8);
    }

    // Photo cells
    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      // Soft rose photo border
      ctx.strokeStyle = "#e8a8b8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padding - 1, y - 1, photoW + 2, photoH + 2);
      drawPhoto(ctx, img, padding, y, photoW, photoH);
    }

    // Caption
    ctx.fillStyle = "#b05068";
    ctx.font = `italic bold 22px 'Caveat', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(caption || "♡ us, always ♡", canvas.width / 2, totalH - 22);

    // Small heart row below caption
    ctx.fillStyle = "#e07090";
    ctx.font = "11px serif";
    ctx.fillText("♥  ♡  ♥", canvas.width / 2, totalH - 8);
  },

  // ── 🎞 Love Film frame ───────────────────────────────────────────────────
  lovefilm: async (canvas, ctx, photos, caption) => {
    const photoW = PHOTO_W, photoH = PHOTO_H, padding = 32, gap = 6;
    const sprocketH = 10, sprocketW = 8, sprocketGap = 18;
    const captionH = 48;
    const totalH = padding + PHOTOS_COUNT * (photoH + gap) - gap + padding + captionH;
    canvas.width  = photoW + padding * 2;
    canvas.height = totalH;

    // Deep rose-black film background
    ctx.fillStyle = "#1a0a0e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle vertical grain
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = `rgba(255,180,180,${Math.random() * 0.03})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }

    // Rose-pink sprocket holes
    const numSprockets = Math.floor(totalH / sprocketGap);
    for (let i = 0; i < numSprockets; i++) {
      const y = 8 + i * sprocketGap;
      // Left
      ctx.fillStyle = "#3a1820";
      ctx.beginPath();
      ctx.roundRect(5, y, sprocketW, sprocketH, 2);
      ctx.fill();
      ctx.strokeStyle = "#c4687a";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(5, y, sprocketW, sprocketH);
      // Right
      ctx.fillStyle = "#3a1820";
      ctx.beginPath();
      ctx.roundRect(canvas.width - 5 - sprocketW, y, sprocketW, sprocketH, 2);
      ctx.fill();
      ctx.strokeStyle = "#c4687a";
      ctx.strokeRect(canvas.width - 5 - sprocketW, y, sprocketW, sprocketH);
    }

    // Photo cells
    for (let i = 0; i < photos.length; i++) {
      const img = await loadImage(photos[i]);
      const y = padding + i * (photoH + gap);
      // Rose glow border
      ctx.strokeStyle = "#c4687a";
      ctx.lineWidth = 1;
      ctx.strokeRect(padding - 1, y - 1, photoW + 2, photoH + 2);
      drawPhoto(ctx, img, padding, y, photoW, photoH);

      // Frame number
      ctx.fillStyle = "#e8a0b0";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}♡`, padding + 4, y + photoH - 4);
    }

    // Caption — glowing pink
    ctx.fillStyle = "#f0a0b8";
    ctx.font = "italic bold 20px 'Caveat', cursive";
    ctx.textAlign = "center";
    ctx.fillText(caption || "♡ captured in love ♡", canvas.width / 2, totalH - 20);

    // Thin rose lines above/below caption
    ctx.strokeStyle = "#c4687a";
    ctx.lineWidth = 0.5;
    const capY = totalH - captionH + 6;
    ctx.beginPath(); ctx.moveTo(padding, capY); ctx.lineTo(canvas.width - padding, capY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padding, totalH - 6); ctx.lineTo(canvas.width - padding, totalH - 6); ctx.stroke();
  },
};
