import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import {
  type BoothSettings,
  type PhotoFilter,
  type FrameStyle,
  type OverlayEffect,
  DEFAULT_SETTINGS,
  FILTERS,
  FRAMES,
  OVERLAYS,
} from "@/lib/booth-settings";

const Customize = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BoothSettings>(DEFAULT_SETTINGS);

  const handleStart = () => {
    navigate("/booth", { state: settings });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 gap-8">
      <BackButton />

      <h1 className="font-sketch text-4xl text-foreground">customize your booth</h1>

      {/* Filter picker */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-3">color filter</h2>
        <div className="grid grid-cols-3 gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSettings((s) => ({ ...s, filter: f.id }))}
              className={`py-2.5 px-3 rounded font-hand text-sm transition-all ${
                settings.filter === f.id
                  ? "bg-foreground text-background"
                  : "sketch-border hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Frame picker */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-3">frame style</h2>
        <div className="grid grid-cols-3 gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              onClick={() => setSettings((s) => ({ ...s, frame: f.id }))}
              className={`py-2.5 px-3 rounded font-hand text-sm transition-all ${
                settings.frame === f.id
                  ? "bg-foreground text-background"
                  : "sketch-border hover:bg-accent"
              }`}
            >
              <span className="mr-1">{f.emoji}</span> {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Overlay picker */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-3">overlay effect</h2>
        <div className="grid grid-cols-3 gap-2">
          {OVERLAYS.map((o) => (
            <button
              key={o.id}
              onClick={() => setSettings((s) => ({ ...s, overlay: o.id }))}
              className={`py-2.5 px-3 rounded font-hand text-sm transition-all ${
                settings.overlay === o.id
                  ? "bg-foreground text-background"
                  : "sketch-border hover:bg-accent"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Caption */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-3">caption</h2>
        <input
          type="text"
          value={settings.caption}
          onChange={(e) => setSettings((s) => ({ ...s, caption: e.target.value }))}
          placeholder="add a handwritten caption..."
          maxLength={40}
          className="w-full px-4 py-3 sketch-border bg-card font-hand text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </section>

      <button onClick={handleStart} className="sketch-button text-xl mt-2">
        start photobooth →
      </button>
    </div>
  );
};

export default Customize;
