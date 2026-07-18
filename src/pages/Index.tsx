import { Link } from "react-router-dom";
import PhotoboothSVG from "@/components/PhotoboothSVG";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-3">

      {/* Floating hearts */}
      <div className="flex gap-3 text-xl select-none pointer-events-none">
        <span className="heart-float">🤍</span>
        <span className="heart-float">♡</span>
        <span className="heart-float">🤍</span>
      </div>

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

      {/* Tagline */}
      <p className="font-romantic text-xl text-center" style={{ color: "hsl(var(--rose))" }}>
        Capture a moment worth keeping forever ♡
      </p>
      <p className="font-hand text-muted-foreground text-sm text-center max-w-xs">
        Your own little vintage photobooth — take 4 photos, create a strip, keep the memory. 📸
      </p>

      <Footer />
    </div>
  );
};

export default Index;
