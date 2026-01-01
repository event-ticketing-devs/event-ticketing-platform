import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import { Toaster } from "react-hot-toast";

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ProfileUpdate from "./pages/ProfileUpdate";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";

// Auth
import Login from "./features/auth/components/Login";
import Register from "./features/auth/components/Register";
import PrivateRoute from "./features/auth/components/PrivateRoute";
import PublicRoute from "./features/auth/components/PublicRoute";
import AdminRoute from "./features/auth/components/AdminRoute";

// Events
import Events from "./features/events/pages/Events";
import EventDetails from "./features/events/pages/EventDetails";
import EventForm from "./features/events/pages/EventForm";

// Bookings
import Dashboard from "./features/bookings/pages/Dashboard";
import TicketView from "./features/bookings/pages/TicketView";
import CancelledBookings from "./features/bookings/pages/CancelledBookings";

// Venues
import Venues from "./features/venues/pages/Venues";
import VenueDetails from "./features/venues/pages/VenueDetails";
import VenueEnquiries from "./features/venues/pages/VenueEnquiries";
import VenueEnquiryDetail from "./features/venues/pages/VenueEnquiryDetail";
import VenuePartnerDashboard from "./features/venues/pages/VenuePartnerDashboard";
import VenuePartnerEnquiryDetail from "./features/venues/pages/VenuePartnerEnquiryDetail";
import VenueRegistration from "./features/venues/pages/VenueRegistration";
import SpaceManagement from "./features/venues/pages/SpaceManagement";
import SpaceAvailabilityManagement from "./features/venues/pages/SpaceAvailabilityManagement";
import VenueEdit from "./features/venues/pages/VenueEdit";
import VenueOptionsManagement from "./features/venues/pages/VenueOptionsManagement";
import ComparisonTray from "./features/venues/components/ComparisonTray";
import SpaceComparisonModal from "./features/venues/components/SpaceComparisonModal";

// Admin
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import FlaggedEvents from "./features/admin/pages/FlaggedEvents";
import FlaggedVenues from "./features/admin/pages/FlaggedVenues";
import AdminContacts from "./features/admin/pages/AdminContacts";
import AdminVenues from "./features/admin/pages/AdminVenues";
import AdminVenueActivity from "./features/admin/pages/AdminVenueActivity";

// Organizer
import OrganizerDashboard from "./features/organizer/pages/OrganizerDashboard";
import OrganizerVerify from "./features/organizer/pages/OrganizerVerify";
import OrganizerDetailsPage from "./features/organizer/pages/OrganizerDetailsPage";
import OrganizerContacts from "./features/organizer/pages/OrganizerContacts";

// Layouts & Common
import Navbar from "./layouts/Navbar";
import Footer from "./layouts/Footer";
import Chatbot from "./common/components/Chatbot";

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
                <Route path="/verify-email" element={<VerifyEmail />} />
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
                path="/admin/flagged-venues"
                element={
                  <AdminRoute>
                    <FlaggedVenues />
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
                path="/admin/venue-options"
                element={
                  <AdminRoute>
                    <VenueOptionsManagement />
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
