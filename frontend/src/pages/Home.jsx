import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to the Event Ticketing Platform
      </h1>
      <Link to="/events" className="text-blue-500 hover:underline">
        View Events
      </Link>
    </div>
  );
};

export default Home;
