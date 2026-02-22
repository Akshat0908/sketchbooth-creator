const PhotoboothSVG = () => {
  return (
    <svg
      viewBox="0 0 600 500"
      className="w-full max-w-[650px] mx-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main booth body */}
      <rect x="80" y="100" width="440" height="350" rx="3" stroke="hsl(var(--sketch-line))" strokeWidth="2.5" fill="none" />
      
      {/* Sign on top - PHOTOBOOTH */}
      <rect x="140" y="55" width="320" height="55" rx="3" stroke="hsl(var(--sketch-line))" strokeWidth="2.5" fill="none" />
      {/* Sign poles */}
      <line x1="180" y1="110" x2="180" y2="100" stroke="hsl(var(--sketch-line))" strokeWidth="2" />
      <line x1="420" y1="110" x2="420" y2="100" stroke="hsl(var(--sketch-line))" strokeWidth="2" />
      {/* Sign supports */}
      <line x1="160" y1="108" x2="160" y2="95" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
      <line x1="440" y1="108" x2="440" y2="95" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
      
      <text
        x="300"
        y="92"
        textAnchor="middle"
        fontFamily="'Patrick Hand', cursive"
        fontSize="36"
        fontWeight="400"
        fill="hsl(var(--sketch-line))"
        letterSpacing="8"
      >
        PHOTOBOOTH
      </text>

      {/* Divider line between left and right sections */}
      <line x1="340" y1="100" x2="340" y2="450" stroke="hsl(var(--sketch-line))" strokeWidth="2" />

      {/* LEFT SIDE - Featured strips area */}
      {/* Featured board frame */}
      <rect x="120" y="140" width="185" height="110" rx="2" stroke="hsl(var(--sketch-line))" strokeWidth="2" fill="hsl(var(--sketch-fill))" />
      
      {/* Photo strip placeholders inside frame */}
      <rect x="135" y="150" width="30" height="90" rx="1" stroke="hsl(var(--sketch-line))" strokeWidth="1.2" fill="hsl(var(--sketch-line) / 0.08)" />
      <rect x="172" y="150" width="30" height="90" rx="1" stroke="hsl(var(--sketch-line))" strokeWidth="1.2" fill="hsl(var(--sketch-line) / 0.08)" />
      <rect x="209" y="150" width="30" height="90" rx="1" stroke="hsl(var(--sketch-line))" strokeWidth="1.2" fill="hsl(var(--sketch-line) / 0.08)" />
      <rect x="246" y="150" width="30" height="90" rx="1" stroke="hsl(var(--sketch-line))" strokeWidth="1.2" fill="hsl(var(--sketch-line) / 0.08)" />

      {/* Mini photos inside strips */}
      {[135, 172, 209, 246].map((x) => (
        <g key={x}>
          <rect x={x + 4} y={155} width={22} height={18} rx="1" fill="hsl(var(--sketch-line) / 0.15)" />
          <rect x={x + 4} y={177} width={22} height={18} rx="1" fill="hsl(var(--sketch-line) / 0.15)" />
          <rect x={x + 4} y={199} width={22} height={18} rx="1" fill="hsl(var(--sketch-line) / 0.15)" />
          <rect x={x + 4} y={221} width={22} height={18} rx="1" fill="hsl(var(--sketch-line) / 0.12)" />
        </g>
      ))}

      {/* "featured strips" text with curly bracket */}
      <text
        x="240"
        y="280"
        textAnchor="middle"
        fontFamily="'Caveat', cursive"
        fontSize="18"
        fill="hsl(var(--sketch-line))"
      >
        featured
      </text>
      <text
        x="240"
        y="300"
        textAnchor="middle"
        fontFamily="'Caveat', cursive"
        fontSize="18"
        fill="hsl(var(--sketch-line))"
      >
        strips
      </text>
      
      {/* Curly bracket */}
      <path d="M225 260 Q220 258 222 265" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />

      {/* Coin slot machine */}
      <rect x="150" y="320" width="40" height="80" rx="2" stroke="hsl(var(--sketch-line))" strokeWidth="2" fill="none" />
      <circle cx="162" cy="340" r="4" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />
      <circle cx="178" cy="340" r="4" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />
      <rect x="158" y="358" width="24" height="32" rx="1" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />
      {/* Coin slot */}
      <line x1="165" y1="370" x2="175" y2="370" stroke="hsl(var(--sketch-line))" strokeWidth="2" />

      {/* RIGHT SIDE - Curtain and entrance */}
      {/* Curtain lines - wavy */}
      <path d="M355 100 Q358 150 352 200 Q348 250 355 300 Q360 350 353 400 Q350 430 355 450" stroke="hsl(var(--sketch-line))" strokeWidth="2" fill="none" />
      <path d="M375 100 Q380 140 373 190 Q368 240 375 290 Q382 340 374 390 Q370 420 375 450" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />
      <path d="M390 100 Q395 155 388 210 Q383 260 390 310 Q396 360 389 410 Q386 435 390 450" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />

      {/* Stool */}
      <ellipse cx="430" cy="385" rx="35" ry="12" stroke="hsl(var(--sketch-line))" strokeWidth="2" fill="hsl(var(--sketch-fill))" />
      <line x1="430" y1="397" x2="430" y2="440" stroke="hsl(var(--sketch-line))" strokeWidth="2" />
      {/* Stool base */}
      <ellipse cx="430" cy="443" rx="22" ry="6" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" fill="none" />

      {/* Small window on far right */}
      <rect x="460" y="160" width="45" height="60" rx="2" stroke="hsl(var(--sketch-line))" strokeWidth="2" fill="none" />
      {/* Window shine lines */}
      <line x1="470" y1="175" x2="485" y2="185" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
      <line x1="473" y1="182" x2="488" y2="192" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
      <line x1="470" y1="195" x2="485" y2="205" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
      <line x1="473" y1="202" x2="488" y2="212" stroke="hsl(var(--sketch-line))" strokeWidth="1.5" />
    </svg>
  );
};

export default PhotoboothSVG;
