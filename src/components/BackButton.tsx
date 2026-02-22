import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  return (
    <Link to="/" className="back-button inline-flex items-center gap-1.5 fixed top-6 left-6 z-10">
      <ArrowLeft size={16} />
      back
    </Link>
  );
};

export default BackButton;
