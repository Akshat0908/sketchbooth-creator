import { useRef, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sketchbooth-music-enabled";
const VOLUME = 0.28; // soft background level

/**
 * Floating music toggle button.
 *
 * Browser autoplay policy:
 *   Audio cannot start without a user gesture. On first click the audio
 *   starts; subsequent clicks toggle play/pause. The user's preference
 *   (playing / paused) is persisted in localStorage so it's remembered
 *   across page navigations within the same session.
 *
 * prefers-reduced-motion:
 *   We also respect this for audio — users who've indicated sensitivity to
 *   motion/animation often prefer a calmer experience overall, so we default
 *   the music to OFF for them (they can still opt in manually).
 */
const MusicPlayer = () => {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const [playing,  setPlaying]  = useState(false);
  const [visible,  setVisible]  = useState(false); // fade-in on mount
  const [hasInteracted, setHasInteracted] = useState(false);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Respect prefers-reduced-motion — default OFF for those users
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const audio = new Audio("/ambient-music.mp3");
    audio.loop   = true;
    audio.volume = VOLUME;
    audioRef.current = audio;

    // Restore user preference from previous session
    const saved = localStorage.getItem(STORAGE_KEY);
    // If reduced-motion, default saved-null to false
    const wantsMusic = prefersReduced
      ? saved === "true"  // only restore ON if they explicitly turned it on
      : saved !== "false"; // default ON for everyone else (but can't autoplay yet)

    // We can't actually play without a gesture, but record the intent
    if (wantsMusic) {
      // Will try to play on the first user interaction anywhere on the page
      setPlaying(false); // stays false until gesture
    }

    // Fade in the button after a short delay so it doesn't flash on load
    const t = setTimeout(() => setVisible(true), 800);

    return () => {
      clearTimeout(t);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      localStorage.setItem(STORAGE_KEY, "false");
    } else {
      try {
        await audio.play();
        setPlaying(true);
        setHasInteracted(true);
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Autoplay blocked (shouldn't happen on a click, but guard anyway)
        setPlaying(false);
      }
    }
  }, [playing]);

  // ── Auto-start on first page interaction (if user previously enabled music) ─
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (hasInteracted || saved !== "true") return;

    const startOnInteraction = async () => {
      const audio = audioRef.current;
      if (!audio || playing) return;
      try {
        await audio.play();
        setPlaying(true);
        setHasInteracted(true);
      } catch {
        // silent — will work once user clicks the toggle
      }
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click",      startOnInteraction);
      document.removeEventListener("keydown",    startOnInteraction);
      document.removeEventListener("touchstart", startOnInteraction);
    };

    document.addEventListener("click",      startOnInteraction, { once: true });
    document.addEventListener("keydown",    startOnInteraction, { once: true });
    document.addEventListener("touchstart", startOnInteraction, { once: true });

    return cleanup;
  }, [hasInteracted, playing]);

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Pause background music" : "Play background music"}
      title={playing ? "Pause music" : "Play music — Before The World Wakes"}
      style={{
        position:     "fixed",
        bottom:       "1.25rem",
        right:        "1.25rem",
        zIndex:       999,
        width:        "2.6rem",
        height:       "2.6rem",
        borderRadius: "50%",
        border:       "1.5px solid hsl(var(--sketch-line) / 0.25)",
        background:   "hsl(0 0% 100% / 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor:       "pointer",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     "1.1rem",
        boxShadow:    "0 2px 12px hsl(var(--rose) / 0.18)",
        opacity:      visible ? 1 : 0,
        transition:   "opacity 0.6s ease, transform 0.18s ease, box-shadow 0.18s ease",
        // Subtle pulse ring when playing
        ...(playing ? {
          boxShadow: "0 2px 12px hsl(var(--rose) / 0.30), 0 0 0 3px hsl(var(--rose) / 0.12)",
        } : {}),
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      {playing ? "🎵" : "🔇"}
    </button>
  );
};

export default MusicPlayer;
