import BackButton from "@/components/BackButton";

const About = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">About Me</h1>
        <div className="space-y-5 text-muted-foreground text-sm leading-relaxed">
          <p>
            Hihi! 👋 I'm Akshat, and I created SketchBooth because I loved the idea of vintage photobooths and wanted to bring that same fun, nostalgic experience online—so anyone can capture cute little moments from the comfort of their own home.
          </p>
          <p>
            I had a lot of fun building this little passion project, and I hope you have just as much fun using it! 📸✨
          </p>
          <p>
            I'm currently working on SketchBooth by myself in my spare time, so it might not be perfect just yet. If you run into any issues or have feedback, ideas, or suggestions, I'd genuinely love to hear from you!
          </p>
          <p>
            I'm constantly working on making SketchBooth better and adding new features, styles, and experiences.
          </p>
          <p>
            Thank you for trying SketchBooth and being a part of this little project of mine. I hope it helps you capture a moment worth keeping. 🤍
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
