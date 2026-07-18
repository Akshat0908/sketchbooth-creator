import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { type BoothSettings, DEFAULT_SETTINGS, FILTERS } from "@/lib/booth-settings";
import { renderPhotostrip } from "@/lib/strip-renderer";
import PremiumDownload from "@/components/PremiumDownload";

const PHOTOS_COUNT = 4;
const COUNTDOWN_SECONDS = 3;

const Booth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings: BoothSettings = (location.state as BoothSettings) || DEFAULT_SETTINGS;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showStrip, setShowStrip] = useState(false);
  const [rendering, setRendering] = useState(false);
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);

  // Get CSS filter string for live preview
  const liveFilter = FILTERS.find((f) => f.id === settings.filter)?.css || "";

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        // Request the highest resolution the device supports.
        // height > width asks for portrait orientation on phones.
        // The browser/OS will pick the closest available resolution.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width:  { ideal: 1080 },
            height: { ideal: 1440 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        // Fallback: accept whatever the device offers
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraReady(true);
          }
        } catch (err) {
          console.error("Camera error:", err);
        }
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    if (!vW || !vH) return null;

    // ── Center-crop to 3:4 portrait ratio ─────────────────────────────────
    // This removes the wide background on both sides and focuses on the subject.
    const TARGET_RATIO = 3 / 4; // portrait
    let srcX = 0, srcY = 0, srcW = vW, srcH = vH;

    const videoRatio = vW / vH;
    if (videoRatio > TARGET_RATIO) {
      // Video is wider than 3:4 — crop left and right sides
      srcW = Math.round(vH * TARGET_RATIO);
      srcX = Math.round((vW - srcW) / 2);
    } else if (videoRatio < TARGET_RATIO) {
      // Video is taller than 3:4 — crop top and bottom
      srcH = Math.round(vW / TARGET_RATIO);
      srcY = Math.round((vH - srcH) / 2);
    }

    const canvas = canvasRef.current;
    canvas.width  = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror horizontally (selfie convention)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.95); // bumped from 0.92
  }, []);

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
        const photo = capturePhoto();
        if (photo) {
          setPhotos((prev) => {
            const next = [...prev, photo];
            if (next.length < PHOTOS_COUNT) {
              setTimeout(() => startSession(), 800);
            } else {
              setTimeout(() => setShowStrip(true), 500);
            }
            return next;
          });
        }
      }
    }, 1000);
  }, [photos.length, capturePhoto]);

  useEffect(() => {
    if (showStrip && stripCanvasRef.current) {
      setRendering(true);
      renderPhotostrip(stripCanvasRef.current, photos, settings).then(() => {
        setRendering(false);
      });
    }
  }, [showStrip, photos, settings]);


  const retake = () => {
    setPhotos([]);
    setShowStrip(false);
  };

  const changeSettings = () => {
    navigate("/customize");
  };

  if (showStrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <BackButton />
        <h2 className="font-sketch text-3xl text-foreground">your photostrip!</h2>
        {rendering && <p className="font-hand text-muted-foreground">applying effects...</p>}
        <canvas ref={stripCanvasRef} className="max-w-[340px] w-full rounded" />
        <PremiumDownload stripCanvasRef={stripCanvasRef} settings={settings} />
        <div className="flex gap-3 flex-wrap justify-center">
          <button onClick={retake} className="sketch-button">
            retake
          </button>
          <button onClick={changeSettings} className="sketch-button">
            change style
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <BackButton />
      
      {/* Current settings indicator */}
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

      <div className="viewfinder relative w-full max-w-[500px] aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)", filter: liveFilter || undefined }}
        />
        {countdown !== null && (
          <div className="countdown-overlay">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}
        {flash && <div className="flash-effect" />}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {cameraReady && photos.length === 0 && (
        <button onClick={startSession} className="sketch-button text-xl">
          start →
        </button>
      )}

      {!cameraReady && (
        <p className="font-hand text-muted-foreground">allow camera access to continue...</p>
      )}

      {photos.length > 0 && (
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt={`Photo ${i + 1}`}
              className="w-16 h-12 object-cover sketch-border"
              style={{ filter: liveFilter || undefined }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Booth;
