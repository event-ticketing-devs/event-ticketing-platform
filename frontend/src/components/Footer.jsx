export default function Footer() {
  return (
    <footer className="backdrop-blur bg-white/80 border-t border-slate-200 text-slate-500 text-center py-6 mt-10 shadow-inner rounded-t-xl">
      <div className="container mx-auto flex flex-col items-center gap-2">
        <span className="text-sm">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-bold text-blue-700">Eventify</span>. All rights
          reserved.
        </span>
        <span className="text-xs">
          Made with <span className="text-pink-500">♥</span> by{" "}
          <a
            href="https://github.com/param-chandarana"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Param
          </a>
          <span className="mx-1">and</span>
          <a
            href="https://github.com/ParthZee"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Parth
          </a>
        </span>
      </div>
    </footer>
  );
}
