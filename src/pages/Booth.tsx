import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { type BoothSettings, DEFAULT_SETTINGS, FILTERS } from "@/lib/booth-settings";
import { renderPhotostrip } from "@/lib/strip-renderer";
import PremiumDownload from "@/components/PremiumDownload";

const PHOTOS_COUNT      = 4;
const COUNTDOWN_SECONDS = 3;

// ── Module-level helpers ──────────────────────────────────────────────────────

/**
 * Center-crops a source (video frame or ImageBitmap) to 3:4 portrait,
 * mirrors it horizontally (selfie convention), and returns a data-URL.
 */
function drawCroppedPortrait(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
): string | null {
  const TARGET_RATIO = 3 / 4; // portrait
  let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;

  const ratio = srcW / srcH;
  if (ratio > TARGET_RATIO) {
    // Video is wider → crop left & right
    cropW = Math.round(srcH * TARGET_RATIO);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (ratio < TARGET_RATIO) {
    // Video is taller → crop top & bottom
    cropH = Math.round(srcW / TARGET_RATIO);
    cropY = Math.round((srcH - cropH) / 2);
  }

  canvas.width  = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Mirror horizontally
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * Quick luminance check on a thumbnail of the bitmap.
 * Returns true if the frame is essentially black (camera not warmed up yet).
 * A black JPEG has avg channel value close to 0; we use 15 as the threshold.
 */
function bitmapIsBlack(bitmap: ImageBitmap): boolean {
  const SIZE = 20;
  const tmp  = document.createElement("canvas");
  tmp.width = SIZE; tmp.height = SIZE;
  const ctx = tmp.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] + data[i + 1] + data[i + 2];
  }
  return sum / (SIZE * SIZE * 3) < 15; // avg luminance < 15 = black frame
}


const Booth = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const settings: BoothSettings = (location.state as BoothSettings) || DEFAULT_SETTINGS;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);
  /** ImageCapture instance, available on browsers that support it (Android Chrome). */
  const imageCaptureRef = useRef<{ takePhoto(): Promise<Blob> } | null>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [photos,       setPhotos]      = useState<string[]>([]);
  const [countdown,    setCountdown]   = useState<number | null>(null);
  const [flash,        setFlash]       = useState(false);
  const [cameraReady,  setCameraReady] = useState(false);
  const [showStrip,    setShowStrip]   = useState(false);
  const [rendering,    setRendering]   = useState(false);
  /**
   * Real aspect ratio of the camera stream (videoWidth/videoHeight).
   * Defaults to 3/4 (portrait) — phones adjust immediately via onLoadedMetadata,
   * laptops stay at their stream ratio once the video starts.
   */
  const [videoAspect, setVideoAspect] = useState<number>(3 / 4);
  const [shareMsg,    setShareMsg]    = useState<string | null>(null);

  // ── CSS filter string for live video preview (real-time, must be fast) ───
  const liveFilter = FILTERS.find((f) => f.id === settings.filter)?.css || "";

  // ── Camera setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width:  { ideal: 1080 },
            height: { ideal: 1440 },
          },
        });
      } catch {
        // Fallback: accept any camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } catch (err) {
          console.error("Camera error:", err);
          return;
        }
      }

      if (!stream) return;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }

      // ── ImageCapture (progressive enhancement) ─────────────────────────
      // Supported on Android Chrome — gives full-sensor stills instead of
      // compressed video frames.  Silently not set on unsupported browsers.
      if ("ImageCapture" in window) {
        try {
          const track = stream.getVideoTracks()[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          imageCaptureRef.current = new (window as any).ImageCapture(track);

          // ── Silent warm-up: pre-initialize the still-image pipeline ────
          // takePhoto() is slow on the very first call (camera auto-focus
          // & AE need to lock — can take 300-700ms). By firing one dummy
          // capture ~400ms after the stream starts, the pipeline is hot
          // before the user even clicks "start". The 3-second countdown
          // gives more than enough headroom for this to complete silently.
          setTimeout(() => {
            imageCaptureRef.current?.takePhoto().catch(() => {});
          }, 400);
        } catch {
          imageCaptureRef.current = null;
        }
      }
    };

    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      imageCaptureRef.current = null;
    };
  }, []);

  // ── Capture logic ─────────────────────────────────────────────────────────
  /**
   * Async capturePhoto:
   *  1. Tries ImageCapture.takePhoto() (full-sensor still, higher quality)
   *     — if the result is a black frame (camera not yet warmed up on first
   *       shot), discards it and falls through to Path B automatically.
   *  2. Falls back to drawing the current video frame (universal support).
   *
   * Always center-crops to 3:4 portrait and mirrors horizontally.
   */
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // ── Path A: ImageCapture ────────────────────────────────────────────────
    if (imageCaptureRef.current) {
      try {
        const blob   = await imageCaptureRef.current.takePhoto();
        const bitmap = await createImageBitmap(blob);

        // Guard against the "black first frame" warm-up issue:
        // takePhoto() can succeed but return a black image on the very first
        // call because the camera's still-image pipeline isn't ready yet.
        // Detect this and fall through to the video-frame fallback.
        if (bitmapIsBlack(bitmap)) {
          bitmap.close();
          throw new Error("black frame — falling back to video");
        }

        const result = drawCroppedPortrait(canvas, bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        if (result) return result;
      } catch {
        // Fall through — silent degradation to video frame
      }
    }

    // ── Path B: Video frame fallback ────────────────────────────────────────
    const video = videoRef.current;
    if (!video) return null;
    const { videoWidth: vW, videoHeight: vH } = video;
    if (!vW || !vH) return null;
    return drawCroppedPortrait(canvas, video, vW, vH);
  }, []);

  // ── Session (countdown → flash → capture loop) ────────────────────────────
  const startSession = useCallback(() => {
    if (photos.length >= PHOTOS_COUNT) return;
    let count = COUNTDOWN_SECONDS;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(interval);
        setFlash(true);
        setTimeout(() => setFlash(false), 300);

        // Async capture with graceful fallback already inside capturePhoto()
        capturePhoto().then((photo) => {
          if (!photo) return;
          setPhotos((prev) => {
            const next = [...prev, photo];
            if (next.length < PHOTOS_COUNT) {
              setTimeout(() => startSession(), 800);
            } else {
              setTimeout(() => setShowStrip(true), 500);
            }
            return next;
          });
        });
      }
    }, 1000);
  }, [photos.length, capturePhoto]);

  // ── Strip rendering (watermarked preview, scale=1) ─────────────────────────
  useEffect(() => {
    if (showStrip && stripCanvasRef.current) {
      setRendering(true);
      renderPhotostrip(stripCanvasRef.current, photos, settings, {
        scale: 1,
        watermark: true,  // Free preview always watermarked
      }).then(() => setRendering(false));
    }
  }, [showStrip, photos, settings]);

  // ── Share to Instagram (Web Share API with fallback) ─────────────────────
  const handleShare = useCallback(async () => {
    const canvas = stripCanvasRef.current;
    if (!canvas) return;
    setShareMsg(null);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92),
    );
    if (!blob) return;

    const file = new File([blob], "my-photobooth-strip.jpg", { type: "image/jpeg" });

    // Try native share sheet (works on Android Chrome + iOS Safari)
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          text: "Made this at @the.keepsakebooth 🤍",
        });
        return; // success
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user cancelled
        // Otherwise fall through to download fallback
      }
    }

    // Fallback: trigger download + show instruction
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = "my-photobooth-strip.jpg"; a.click();
    URL.revokeObjectURL(url);
    setShareMsg("📲 Saved! Upload it to your Instagram Story and tag @the.keepsakebooth ✨");
  }, []);

  const retake         = () => { setPhotos([]); setShowStrip(false); setShareMsg(null); };
  const changeSettings = () => { navigate("/customize"); };

  // ── Result screen ─────────────────────────────────────────────────────────
  if (showStrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <BackButton />
        <h2 className="font-sketch text-3xl text-foreground">your photostrip!</h2>

        {rendering && (
          <p className="font-hand text-muted-foreground animate-pulse">applying effects...</p>
        )}

        {/* Strip canvas — right-click disabled; pointer-events off so users can't easily save */}
        <canvas
          ref={stripCanvasRef}
          className="max-w-[340px] w-full rounded"
          style={{ pointerEvents: "none" }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Premium download card */}
        <PremiumDownload
          stripCanvasRef={stripCanvasRef}
          settings={settings}
          photos={photos}
        />

        {/* Share / Instagram section */}
        <div className="flex flex-col items-center gap-2 w-full max-w-sm">
          <button
            onClick={handleShare}
            className="sketch-button w-full flex items-center justify-center gap-2 text-base"
          >
            📲 Share to Instagram
          </button>

          {shareMsg && (
            <p className="font-hand text-sm text-center" style={{ color: "hsl(var(--rose))" }}>
              {shareMsg}
            </p>
          )}

          <a
            href="https://www.instagram.com/the.keepsakebooth"
            target="_blank"
            rel="noopener noreferrer"
            className="font-hand text-sm underline-offset-2 underline hover:opacity-75 transition-opacity"
            style={{ color: "hsl(var(--rose))" }}
          >
            ♡ Follow @the.keepsakebooth on Instagram
          </a>
        </div>

        {/* Retake / change style */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button onClick={retake}         className="sketch-button">retake</button>
          <button onClick={changeSettings} className="sketch-button">change style</button>
        </div>
      </div>
    );
  }

  // ── Camera screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <BackButton />

      {/* Settings badges */}
      <div className="flex gap-2 flex-wrap justify-center">
        {settings.filter !== "none" && (
          <span className="font-hand text-xs px-2 py-1 sketch-border text-muted-foreground">
            {FILTERS.find((f) => f.id === settings.filter)?.label}
          </span>
        )}
        {settings.frame !== "classic" && (
          <span className="font-hand text-xs px-2 py-1 sketch-border text-muted-foreground">
            {settings.frame}
          </span>
        )}
        {settings.overlay !== "none" && (
          <span className="font-hand text-xs px-2 py-1 sketch-border text-muted-foreground">
            {settings.overlay}
          </span>
        )}
      </div>

      <h2 className="font-sketch text-3xl text-foreground">
        {photos.length === 0 ? "ready?" : `${photos.length} / ${PHOTOS_COUNT}`}
      </h2>

      {/*
        ── Viewfinder ──────────────────────────────────────────────────────
        aspect-[4/3] removed; replaced by dynamic inline style derived from
        the real camera stream dimensions (read in onLoadedMetadata).
        On phones this becomes ~3:4 (portrait).
        On laptops it stays at whatever the webcam reports (typically 4:3 or 16:9).
      */}
      <div
        className="viewfinder relative w-full max-w-[500px]"
        style={{ aspectRatio: videoAspect }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)", filter: liveFilter || undefined }}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (video && video.videoWidth && video.videoHeight) {
              setVideoAspect(video.videoWidth / video.videoHeight);
            }
          }}
        />
        {countdown !== null && (
          <div className="countdown-overlay">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}
        {flash && <div className="flash-effect" />}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {cameraReady && photos.length === 0 && (
        <button onClick={startSession} className="sketch-button text-xl">
          start →
        </button>
      )}

      {!cameraReady && (
        <p className="font-hand text-muted-foreground">allow camera access to continue...</p>
      )}

      {/* Thumbnail strip of captured photos */}
      {photos.length > 0 && (
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt={`Photo ${i + 1}`}
              className="w-14 h-20 object-cover sketch-border"
              style={{ filter: liveFilter || undefined }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Booth;
