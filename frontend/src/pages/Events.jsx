import { Link } from "react-router-dom";

const Events = () => {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Events List</h2>
        {/* Placeholder for events list */}
        <Link to="/events/1" className="text-blue-500 hover:underline mb-2">
          View Event 1
        </Link>
        <Link to="/events/2" className="text-blue-500 hover:underline mb-2">
          View Event 2
        </Link>
        <Link to="/events/3" className="text-blue-500 hover:underline mb-2">
          View Event 3
        </Link>
      </div>
    </div>
  );
};

export default Events;
