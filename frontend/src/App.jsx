import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Login from "./pages/Login";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import ProfileUpdate from "./pages/ProfileUpdate";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import AdminRoute from "./components/AdminRoute";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FlaggedEvents from "./pages/FlaggedEvents";
import EventForm from "./pages/EventForm";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import OrganizerVerify from "./pages/OrganizerVerify";
import TicketView from "./pages/TicketView";
import CancelledBookings from "./pages/CancelledBookings";
import OrganizerDetailsPage from "./pages/OrganizerDetailsPage";
import ContactUs from "./pages/ContactUs";
import AdminContacts from "./pages/AdminContacts";
import OrganizerContacts from "./pages/OrganizerContacts";
import Chatbot from "./components/Chatbot";
import Venues from "./pages/Venues";
import VenueDetails from "./pages/VenueDetails";
import VenueEnquiries from "./pages/VenueEnquiries";
import VenueEnquiryDetail from "./pages/VenueEnquiryDetail";
import VenuePartnerDashboard from "./pages/VenuePartnerDashboard";
import VenuePartnerEnquiryDetail from "./pages/VenuePartnerEnquiryDetail";
import VenueRegistration from "./pages/VenueRegistration";
import SpaceManagement from "./pages/SpaceManagement";
import SpaceAvailabilityManagement from "./pages/SpaceAvailabilityManagement";
import VenueEdit from "./pages/VenueEdit";
import AdminVenues from "./pages/AdminVenues";
import AdminVenueActivity from "./pages/AdminVenueActivity";
import ComparisonTray from "./components/ComparisonTray";
import SpaceComparisonModal from "./components/SpaceComparisonModal";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ComparisonProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/venues/:id" element={<VenueDetails />} />
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
                path="/venue-enquiries"
                element={
                  <PrivateRoute>
                    <VenueEnquiries />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-enquiries"
                element={
                  <PrivateRoute>
                    <VenueEnquiries />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-enquiries/:id"
                element={
                  <PrivateRoute>
                    <VenueEnquiryDetail />
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
                path="/venue-partner"
                element={
                  <PrivateRoute>
                    <VenuePartnerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-partner/register"
                element={
                  <PrivateRoute>
                    <VenueRegistration />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-partner/venues/:venueId/edit"
                element={
                  <PrivateRoute>
                    <VenueEdit />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-partner/venues/:venueId/spaces"
                element={
                  <PrivateRoute>
                    <SpaceManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-partner/spaces/:spaceId/availability"
                element={
                  <PrivateRoute>
                    <SpaceAvailabilityManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/venue-partner/enquiries/:id"
                element={
                  <PrivateRoute>
                    <VenuePartnerEnquiryDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/flagged-events"
                element={
                  <AdminRoute>
                    <FlaggedEvents />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/contacts"
                element={
                  <AdminRoute>
                    <AdminContacts />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/venues"
                element={
                  <AdminRoute>
                    <AdminVenues />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/venues/:id/activity"
                element={
                  <AdminRoute>
                    <AdminVenueActivity />
                  </AdminRoute>
                }
              />
              <Route
                path="/organizer/contacts"
                element={
                  <PrivateRoute>
                    <OrganizerContacts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/organizer/:id"
                element={
                  <AdminRoute>
                    <OrganizerDetailsPage />
                  </AdminRoute>
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
          <ComparisonTray />
          <SpaceComparisonModal />
          <Chatbot />
          <Footer />
        </div>
      </ComparisonProvider>
    </AuthProvider>
  </Router>
);
}

export default App;
