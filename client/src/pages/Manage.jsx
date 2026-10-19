import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatDate, formatPrice } from "../lib/format.js";
import { ErrorBox, Loading } from "../components/Status.jsx";

export default function Manage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/me/events")
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page narrow">
      <div className="section-head">
        <h1>Your events</h1>
        <Link to="/events/new" className="btn btn-small">+ New event</Link>
      </div>
      <ErrorBox message={error} />
      {!events && !error && <Loading />}
      {events && events.length === 0 && (
        <div className="empty">
          <p>You haven't created any events yet.</p>
          <Link to="/events/new" className="btn">Create one</Link>
        </div>
      )}
      <div className="stack">
        {events?.map((e) => (
          <div key={e.id} className="manage-row">
            <div>
              <Link to={`/events/${e.id}`} className="manage-title">{e.title}</Link>
              <p className="muted small">{formatDate(e.starts_at)} · {e.venue} · {formatPrice(e.price)}</p>
            </div>
            <div className="manage-stats">
              <span><strong>{e.tickets_sold}</strong>/{e.capacity} sold</span>
              <span><strong>{e.checked_in}</strong> in</span>
              <Link to={`/events/${e.id}/checkin`} className="btn btn-small">Check-in</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
