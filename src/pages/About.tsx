import BackButton from "@/components/BackButton";

const About = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">About Me</h1>
        <div className="space-y-5 text-muted-foreground text-sm leading-relaxed">
          <p>
            Hihi! 👋 I'm V and I made this online vintage photobooth just because there were no vintage photobooths near me and I wanted to join in on the fun from the comfort of my own home. I had a lot of fun making this little passion project of mine so I hope you enjoy using it as much as I did!
          </p>
          <p>
            I am also the only person working on this project in my spare time so it is not in any means perfect but please shoot me a message if you have any feedback/suggestions/issues with the website at all.
          </p>
          <p>
            I am still constantly adding new features and improving the website so feel free to follow me on @visarchivess on TikTok and Instagram (linked below!) to be the first to know about the latest updates and improvements!
          </p>
        </div>
        <div className="flex justify-center gap-4 mt-8">
          <a href="https://www.tiktok.com/@visarchivess" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="TikTok">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/></svg>
          </a>
          <a href="https://www.instagram.com/visarchivess" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
