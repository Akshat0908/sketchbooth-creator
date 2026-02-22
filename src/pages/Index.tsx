import { Link } from "react-router-dom";
import PhotoboothSVG from "@/components/PhotoboothSVG";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-2">
      <div className="relative w-full max-w-[650px]">
        <PhotoboothSVG />
        {/* Enter button positioned over the booth */}
        <Link
          to="/booth"
          className="sketch-button absolute text-lg"
          style={{ right: "18%", top: "54%", transform: "translate(50%, -50%)" }}
        >
          enter →
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
