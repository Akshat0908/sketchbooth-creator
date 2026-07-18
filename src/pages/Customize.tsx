import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import {
  type BoothSettings,
  DEFAULT_SETTINGS,
  FILTERS,
  FRAMES,
  OVERLAYS,
} from "@/lib/booth-settings";

const ROMANTIC_SUGGESTIONS = [
  "you & me 🤍",
  "date night 🌹",
  "our happy place ✨",
  "forever 🔒",
  "us ✿",
];

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

      {/* Frame style picker */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-3">frame style</h2>
        <div className="grid grid-cols-3 gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              onClick={() => setSettings((s) => ({ ...s, frame: f.id }))}
              className={`py-2.5 px-3 rounded font-hand text-sm transition-all ${
                settings.frame === f.id
                  ? "bg-foreground text-background font-bold border-transparent"
                  : "sketch-border hover:bg-accent"
              }`}
              style={
                settings.frame === f.id && (f.id === 'hearts' || f.id === 'lovefilm')
                  ? { background: 'hsl(var(--rose))', color: '#fff' }
                  : undefined
              }
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

      {/* Caption & Suggestions */}
      <section className="w-full max-w-md">
        <h2 className="font-hand text-xl text-foreground mb-2">caption</h2>
        
        {/* Caption suggestion chips */}
        <div className="flex gap-2 flex-wrap mb-3">
          {ROMANTIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSettings((s) => ({ ...s, caption: suggestion }))}
              className="px-3 py-1 rounded-full text-xs font-hand bg-card sketch-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={settings.caption}
          onChange={(e) => setSettings((s) => ({ ...s, caption: e.target.value }))}
          placeholder="add a handwritten caption..."
          maxLength={40}
          className="w-full px-4 py-3 sketch-border bg-card font-hand text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </section>

      {/* CTA Button */}
      <button 
        onClick={handleStart} 
        className="romantic-button pulse-rose text-xl mt-2 font-bold px-8 py-3.5"
      >
        start photobooth 📸
      </button>
    </div>
  );
};

export default Customize;
