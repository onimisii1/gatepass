import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import PaymentReturn from "./components/PaymentReturn.jsx";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventPage from "./pages/EventPage.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import Manage from "./pages/Manage.jsx";
// The scanner library is big, so only download it when someone opens check-in.
const CheckIn = lazy(() => import("./pages/CheckIn.jsx"));

export default function App() {
  return (
    <>
      <Navbar />
      <PaymentReturn />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/events/new" element={<RequireAuth><CreateEvent /></RequireAuth>} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route
            path="/events/:id/checkin"
            element={
              <RequireAuth>
                <Suspense fallback={<p className="muted center pad">Loading scanner…</p>}>
                  <CheckIn />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route path="/tickets" element={<RequireAuth><MyTickets /></RequireAuth>} />
          <Route path="/manage" element={<RequireAuth><Manage /></RequireAuth>} />
          <Route
            path="*"
            element={
              <div className="page narrow center">
                <h1>Page not found</h1>
                <Link to="/" className="btn">Back to events</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <span>Gatepass</span>
        <span className="muted">Tickets &amp; QR check-in for events in Lagos</span>
      </footer>
    </>
  );
}
