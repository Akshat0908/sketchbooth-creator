import BackButton from "@/components/BackButton";

const Privacy = () => {
  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="font-hand text-4xl text-center mb-10 text-foreground">Privacy Policy</h1>
        <div className="space-y-5 text-muted-foreground text-sm leading-relaxed">
          <p>
            Your privacy is important to us. This photobooth application does not collect, store, or share any personal data or photos.
          </p>
          <p>
            <strong className="text-foreground">Camera Access:</strong> The photobooth requires access to your device's camera to function. Camera access is only used to display the live preview and capture photos when you click the capture button.
          </p>
          <p>
            <strong className="text-foreground">Photo Storage:</strong> All photos are processed entirely within your browser. No images are uploaded to any server. Photos only exist on your device unless you choose to download them.
          </p>
          <p>
            <strong className="text-foreground">Cookies:</strong> This website does not use tracking cookies or analytics that collect personal information.
          </p>
          <p>
            If you have any questions about this privacy policy, please feel free to contact us through the Contact page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
