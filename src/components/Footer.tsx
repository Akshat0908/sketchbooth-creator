import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center gap-3 pb-6">
      <p className="font-hand text-muted-foreground text-sm">
        made by{" "}
        <a
          href="https://www.instagram.com/visarchivess"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          @visarchivess
        </a>
        {" "}
        <a href="https://www.tiktok.com/@visarchivess" target="_blank" rel="noopener noreferrer" title="TikTok" className="inline-block align-middle hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/></svg>
        </a>
        {" "}
        <a href="https://www.instagram.com/visarchivess" target="_blank" rel="noopener noreferrer" title="Instagram" className="inline-block align-middle hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </a>
      </p>
      <nav className="flex gap-6 flex-wrap justify-center">
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <Link to="/pricing" className="footer-link">Pricing</Link>
        <Link to="/faq" className="footer-link">FAQ</Link>
        <Link to="/about" className="footer-link">About Me</Link>
        <Link to="/contact" className="footer-link">Contact Me</Link>
      </nav>
    </footer>
  );
};

export default Footer;
