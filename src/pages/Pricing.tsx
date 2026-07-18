import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8">

      {/* Back link */}
      <Link
        to="/"
        className="self-start ml-4 font-hand text-muted-foreground text-sm underline underline-offset-2 hover:text-foreground transition-colors"
      >
        ← back
      </Link>

      <div className="w-full max-w-2xl flex flex-col items-center gap-8">

        {/* Badge */}
        <span className="font-hand text-sm text-muted-foreground sketch-border px-4 py-1.5 rounded-full">
          ✨ Free Preview • Premium HD Download
        </span>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-sketch text-4xl text-foreground">Premium HD Download</h1>
          <p className="font-hand text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Create your vintage photobooth strip for free and unlock the premium HD version anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">

          {/* Free card */}
          <div className="sketch-border bg-card rounded p-6 flex flex-col gap-4">
            <div>
              <p className="font-hand text-xs text-muted-foreground uppercase tracking-widest mb-1">Free</p>
              <p className="font-sketch text-5xl text-foreground">₹0</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {[
                "Take unlimited photobooth sessions",
                "Preview your photo strip",
                "Watermarked preview",
              ].map((f) => (
                <li key={f} className="font-hand text-foreground flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0">•</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/customize" className="sketch-button text-sm text-center block w-full">
              start free →
            </Link>
          </div>

          {/* Premium card */}
          <div
            className="rounded p-6 flex flex-col gap-4"
            style={{
              border: "2.5px solid hsl(220 20% 20%)",
              background: "hsl(220 20% 20%)",
              color: "hsl(220 14% 94%)",
              boxShadow: "4px 4px 0 hsl(220 20% 20% / 0.25)",
            }}
          >
            <div>
              <p
                className="font-hand text-xs uppercase tracking-widest mb-1"
                style={{ color: "hsl(220 14% 75%)" }}
              >
                Premium
              </p>
              <p className="font-sketch text-5xl" style={{ color: "hsl(220 14% 94%)" }}>₹49</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {[
                "HD Download",
                "No Watermark",
                "Print Ready",
                "High Resolution",
                "Lifetime Download",
                "Instant Download After Payment",
              ].map((f) => (
                <li key={f} className="font-hand flex items-start gap-2 text-sm" style={{ color: "hsl(220 14% 88%)" }}>
                  <span className="mt-0.5 shrink-0" style={{ color: "hsl(220 14% 94%)" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/customize"
              className="font-hand text-sm text-center block w-full py-3 px-6 rounded transition-all"
              style={{
                background: "hsl(220 14% 94%)",
                color: "hsl(220 20% 20%)",
                border: "2px solid hsl(220 14% 94%)",
              }}
            >
              Try it free →
            </Link>
          </div>
        </div>

        {/* Digital product note */}
        <p className="font-hand text-muted-foreground text-xs text-center max-w-sm leading-relaxed">
          SketchBooth is a digital product. Your HD photobooth strip is generated instantly and
          becomes available for download immediately after successful payment.
        </p>

      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
