import BackButton from "@/components/BackButton";

const Contact = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">Contact Me</h1>
        <div className="text-center space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>
            Have any questions, feedback, or suggestions? I'd genuinely love to hear from you!
          </p>
          <p>
            Reach out and I'll get back to you as soon as I can. 🤍
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
