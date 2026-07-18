import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PhotoboothSVG from "@/components/PhotoboothSVG";
import Footer from "@/components/Footer";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── prefers-reduced-motion guard ─────────────────────────────────────────
  // If the user has opted into reduced motion, we leave the video paused so
  // the poster image (static blush background) shows instead.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      video.pause();
    } else {
      // Play is called by autoPlay, but some browsers (e.g. iOS) need a
      // gentle nudge after the component mounts. Ignore errors — if
      // autoplay is blocked we degrade to the poster gracefully.
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-3">

      {/* ── Hero section with ambient video background ─────────────────────── */}
      {/*
        The wrapper is "relative" so the absolutely-positioned <video> sits
        behind all hero content.  The video is atmosphere-only — opacity is
        kept low so the illustration and text stay the clear visual focus.
        The rest of the page (footer) is NOT wrapped here; the video is
        scoped to the hero content only.
      */}
      <div className="relative flex flex-col items-center gap-3 w-full max-w-[700px]">

        {/* Ambient bokeh video — hidden from assistive tech (aria-hidden) */}
        <video
          ref={videoRef}
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-ambient-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover -z-10 rounded-lg"
          style={{
            opacity: 0.35,
            // Slight warm blush blend so the video tones into the page bg
            mixBlendMode: "multiply",
          }}
        >
          {/* webm first (smaller), mp4 as fallback */}
          <source src="/hero-ambient-loop.webm" type="video/webm" />
          <source src="/hero-ambient-loop.mp4"  type="video/mp4"  />
          {/* If video is unsupported entirely, the poster shows as a plain img-like bg */}
        </video>

        {/* ── Floating hearts (unchanged) ──────────────────────────────────── */}
        <div className="flex gap-3 text-xl select-none pointer-events-none pt-4">
          <span className="heart-float">🤍</span>
          <span className="heart-float">♡</span>
          <span className="heart-float">🤍</span>
        </div>

        {/* ── Photobooth illustration + Enter button (unchanged layout) ──────── */}
        <div className="relative w-full max-w-[650px]">
          <PhotoboothSVG />
          <Link
            to="/customize"
            className="sketch-button absolute text-lg"
            style={{ right: "18%", top: "54%", transform: "translate(50%, -50%)" }}
          >
            enter →
          </Link>
        </div>

        {/* ── Tagline (unchanged) ───────────────────────────────────────────── */}
        <p className="font-romantic text-xl text-center pb-4" style={{ color: "hsl(var(--rose))" }}>
          Capture a moment worth keeping forever ♡
        </p>
        <p className="font-hand text-muted-foreground text-sm text-center max-w-xs pb-2">
          Your own little vintage photobooth — take 4 photos, create a strip, keep the memory. 📸
        </p>

      </div>{/* end hero wrapper */}

      <Footer />
    </div>
  );
};

export default Index;
