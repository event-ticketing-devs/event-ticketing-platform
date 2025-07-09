import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl shadow-md">
      <h1 className="text-5xl font-extrabold mb-6 text-blue-700 drop-shadow-lg text-center">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
          Eventify
        </span>
      </h1>
      <p className="mb-8 text-lg text-slate-600 text-center max-w-xl">
        Discover, book, and manage events with ease. Join the best event
        platform for organizers and attendees.
      </p>
      <Link
        to="/events"
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-400 text-white rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all text-lg font-semibold"
      >
        View Events
      </Link>
    </div>
  );
};

export default Home;
