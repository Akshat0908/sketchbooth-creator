import BackButton from "@/components/BackButton";

const faqData = [
  {
    q: "How does the online photobooth work?",
    a: 'Click "Enter" on the homepage, allow camera access when prompted, and follow the on-screen instructions to take your photos. The photobooth will guide you through the process and create a vintage-style photostrip that you can download instantly.',
  },
  {
    q: "Do I need to create an account or sign up?",
    a: "No! The photobooth is completely free to use and doesn't require any registration, account creation, or personal information. Just visit the site and start taking photos!",
  },
  {
    q: "Are my photos stored or saved anywhere?",
    a: "No, your photos are never stored anywhere. All photo processing happens locally in your browser, and photos only exist on your device unless you choose to download them.",
  },
  {
    q: "What devices and browsers are supported?",
    a: "The photobooth works on most modern devices including phones, tablets, and computers. It's compatible with Chrome, Safari, Firefox, and Edge browsers. You'll need a working camera and internet connection.",
  },
  {
    q: "How do I download my photostrip?",
    a: "After taking your photos, you'll see a preview of your photo strip. Click the download button to save it to your device!",
  },
  {
    q: "Is there a limit to how many photos I can take?",
    a: "No limits! You can use the photobooth as many times as you want. Each session creates a new photostrip, so feel free to experiment with different poses!",
  },
  {
    q: "What if my camera isn't working?",
    a: "Make sure you've granted camera permissions when prompted. If you're still having issues, try refreshing the page or try using a different browser.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">FAQ</h1>
        <div className="space-y-8">
          {faqData.map((item, i) => (
            <div key={i}>
              <h3 className="font-hand text-lg font-semibold text-foreground mb-2">
                Q: {item.q}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A: {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
