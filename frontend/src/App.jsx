import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Login from "./pages/Login";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import ProfileUpdate from "./pages/ProfileUpdate";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import EventForm from "./pages/EventForm";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import OrganizerVerify from "./pages/OrganizerVerify";
import TicketView from "./pages/TicketView";
import CancelledBookings from "./pages/CancelledBookings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="*" element={<NotFound />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/update"
                element={
                  <PrivateRoute>
                    <ProfileUpdate />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cancelled-bookings"
                element={
                  <PrivateRoute>
                    <CancelledBookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ticket/:bookingId"
                element={
                  <PrivateRoute>
                    <TicketView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/organizer"
                element={
                  <PrivateRoute>
                    <OrganizerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/verify/:eventId"
                element={
                  <PrivateRoute>
                    <OrganizerVerify />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/verify"
                element={
                  <PrivateRoute>
                    <OrganizerVerify />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/create"
                element={
                  <PrivateRoute>
                    <EventForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/edit/:id"
                element={
                  <PrivateRoute>
                    <EventForm />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
