import BackButton from "@/components/BackButton";

const Contact = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">Contact Me</h1>
        <div className="text-center space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>
            Have any questions, feedback, or suggestions? I'd love to hear from you!
          </p>
          <p>
            You can reach me through my social media accounts:
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <a href="https://www.tiktok.com/@visarchivess" target="_blank" rel="noopener noreferrer" className="sketch-button inline-flex items-center gap-2">
              TikTok
            </a>
            <a href="https://www.instagram.com/visarchivess" target="_blank" rel="noopener noreferrer" className="sketch-button inline-flex items-center gap-2">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
