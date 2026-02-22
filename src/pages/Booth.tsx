import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

const PHOTOS_COUNT = 4;
const COUNTDOWN_SECONDS = 3;

const Booth = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showStrip, setShowStrip] = useState(false);
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
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
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Mirror the image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
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
        // Flash
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        // Capture
        const photo = capturePhoto();
        if (photo) {
          setPhotos((prev) => {
            const next = [...prev, photo];
            if (next.length < PHOTOS_COUNT) {
              // Auto-start next countdown
              setTimeout(() => startSession(), 800);
            } else {
              // All photos taken
              setTimeout(() => setShowStrip(true), 500);
            }
            return next;
          });
        }
      }
    }, 1000);
  }, [photos.length, capturePhoto]);

  const generateStrip = useCallback(() => {
    if (!stripCanvasRef.current || photos.length < PHOTOS_COUNT) return;
    const canvas = stripCanvasRef.current;
    const photoW = 300;
    const photoH = 225;
    const padding = 16;
    const gap = 8;
    const totalH = padding * 2 + PHOTOS_COUNT * photoH + (PHOTOS_COUNT - 1) * gap + 60;
    canvas.width = photoW + padding * 2;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "hsl(220, 20%, 25%)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    let loaded = 0;
    photos.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        const y = padding + i * (photoH + gap);
        // Draw photo with slight border
        ctx.strokeStyle = "hsl(220, 15%, 80%)";
        ctx.lineWidth = 1;
        ctx.strokeRect(padding - 1, y - 1, photoW + 2, photoH + 2);
        ctx.drawImage(img, padding, y, photoW, photoH);
        loaded++;
        if (loaded === PHOTOS_COUNT) {
          // Add text at bottom
          ctx.fillStyle = "hsl(220, 20%, 25%)";
          ctx.font = "16px 'Patrick Hand', cursive";
          ctx.textAlign = "center";
          ctx.fillText("mysketchbooth ✿", canvas.width / 2, totalH - 20);
        }
      };
      img.src = src;
    });
  }, [photos]);

  useEffect(() => {
    if (showStrip) {
      setTimeout(generateStrip, 100);
    }
  }, [showStrip, generateStrip]);

  const downloadStrip = () => {
    if (!stripCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = "photobooth-strip.jpg";
    link.href = stripCanvasRef.current.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const retake = () => {
    setPhotos([]);
    setShowStrip(false);
  };

  if (showStrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <BackButton />
        <h2 className="font-sketch text-3xl text-foreground">your photostrip!</h2>
        <canvas ref={stripCanvasRef} className="sketch-border max-w-[340px] w-full" />
        <div className="flex gap-4">
          <button onClick={downloadStrip} className="sketch-button">
            download ↓
          </button>
          <button onClick={retake} className="sketch-button">
            retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <BackButton />
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
          style={{ transform: "scaleX(-1)" }}
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

      {/* Mini preview of taken photos */}
      {photos.length > 0 && (
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <img key={i} src={p} alt={`Photo ${i + 1}`} className="w-16 h-12 object-cover sketch-border" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Booth;
