import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

// After paying, Paystack sends the visitor back to
//   .../gatepass/?pay_event=<id>&reference=<ref>
// This spots that, asks our API to verify the payment, then shows the ticket.
export default function PaymentReturn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    const eventId = params.get("pay_event");
    if (!reference || loading || !user) return;

    // Remove ?reference=... from the address bar so a refresh doesn't repeat this.
    window.history.replaceState(null, "", window.location.pathname);
    setMessage("Confirming your payment…");

    api("/payments/verify", { method: "POST", body: { reference } })
      .then(() => {
        setMessage(null);
        navigate("/tickets", { state: { justBought: eventId } });
      })
      .catch((err) => {
        setMessage(null);
        setError(err.message);
      });
  }, [user, loading, navigate]);

  if (!message && !error) return null;
  return (
    <div className="overlay">
      <div className="overlay-card">
        {message && <p>{message}</p>}
        {error && (
          <>
            <p className="error-text">{error}</p>
            <button className="btn" onClick={() => setError(null)}>OK</button>
          </>
        )}
      </div>
    </div>
  );
}
