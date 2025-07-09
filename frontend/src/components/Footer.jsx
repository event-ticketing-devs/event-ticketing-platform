export default function Footer() {
  return (
    <footer className="backdrop-blur bg-white/80 border-t border-slate-200 text-slate-500 text-center py-6 mt-10 shadow-inner rounded-t-xl">
      <div className="container mx-auto flex flex-col items-center gap-2">
        <span className="text-sm">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-bold text-blue-700">Eventify</span>. All rights
          reserved.
        </span>
      </div>
    </footer>
  );
}
