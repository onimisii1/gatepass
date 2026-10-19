import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate, formatPrice, formatTime } from "../lib/format.js";
import TicketCard from "../components/TicketCard.jsx";
import { ErrorBox, Loading } from "../components/Status.jsx";

export default function EventPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    return api(`/events/${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  // Reload when the event id changes, or once we know who is logged in.
  useEffect(() => {
    if (!authLoading) load();
  }, [load, authLoading, user]);

  async function getTicket() {
    setActionError(null);
    setBusy(true);
    try {
      if (data.event.price === 0) {
        await api(`/events/${id}/register`, { method: "POST" });
      } else {
        const result = await api(`/events/${id}/pay`, { method: "POST" });
        if (result.mode === "paystack") {
          window.location.href = result.authorization_url; // off to Paystack checkout
          return;
        }
      }
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Couldn't copy. Copy the address from your browser instead.");
    }
  }

  if (error) return <div className="page narrow"><ErrorBox message={error} /></div>;
  if (!data) return <Loading />;

  const { event, myTicket, isOrganiser } = data;
  const left = event.capacity - event.tickets_sold;
  const soldOut = left <= 0;

  return (
    <div className="page narrow">
      <Link to="/" className="back">← All events</Link>

      <article className="ticket detail-ticket">
        <div className="ticket-main column">
          <p className="eyebrow">{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</p>
          <h1>{event.title}</h1>
          <p className="event-meta">{event.venue}</p>
          <p className="event-meta small">Hosted by {event.organiser_name}</p>
          {event.description && <p className="description">{event.description}</p>}
        </div>
        <div className="ticket-stub">
          <span className="price big">{formatPrice(event.price)}</span>
          <span className="muted small">{soldOut ? "Sold out" : `${left} of ${event.capacity} left`}</span>
        </div>
      </article>

      <ErrorBox message={actionError} />

      {myTicket ? (
        <div className="stack">
          <p className="success-text">You're going. Show this at the door:</p>
          <TicketCard ticket={{ ...event, ...myTicket }} />
          <Link to="/tickets" className="btn btn-ghost">All my tickets</Link>
        </div>
      ) : !user ? (
        <Link to="/login" state={{ from: location.pathname }} className="btn btn-block">
          Log in to get a ticket
        </Link>
      ) : (
        <button className="btn btn-block" onClick={getTicket} disabled={busy || soldOut}>
          {soldOut
            ? "Sold out"
            : busy
              ? "Please wait…"
              : event.price === 0
                ? "Get free ticket"
                : `Pay ${formatPrice(event.price)}`}
        </button>
      )}

      {isOrganiser && (
        <section className="organiser-panel">
          <p className="eyebrow">You're the organiser</p>
          <div className="row-actions">
            <Link to={`/events/${event.id}/checkin`} className="btn">Open check-in</Link>
            <button className="btn btn-ghost" onClick={copyLink}>{copied ? "Link copied ✓" : "Copy share link"}</button>
          </div>
          <p className="muted small">{event.tickets_sold} tickets issued so far.</p>
        </section>
      )}
    </div>
  );
}
