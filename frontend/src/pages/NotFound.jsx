import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-bg-primary px-4">
      {/* 404 Icon */}
      <FileQuestion className="w-32 h-32 mb-6 text-text-secondary" />

      <h1 className="text-6xl font-black text-text-primary mb-4">404</h1>

      <p className="text-xl text-text-secondary mb-8 text-center max-w-md">
        Oops! The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
      >
        Back to Home
      </Link>
    </div>
  );
}
