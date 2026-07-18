import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center gap-3 pb-6">
      <nav className="flex gap-6 flex-wrap justify-center">
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <Link to="/pricing" className="footer-link">Pricing</Link>
        <Link to="/faq" className="footer-link">FAQ</Link>
        <Link to="/about" className="footer-link">About Me</Link>
        <Link to="/contact" className="footer-link">Contact Me</Link>
        <a
          href="https://www.instagram.com/the.keepsakebooth"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          style={{ color: 'hsl(var(--rose))' }}
        >
          ♡ Instagram
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
