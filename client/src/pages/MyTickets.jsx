import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import TicketCard from "../components/TicketCard.jsx";
import { ErrorBox, Loading } from "../components/Status.jsx";

export default function MyTickets() {
  const location = useLocation();
  const justBought = location.state?.justBought;
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/me/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page narrow">
      <h1>My tickets</h1>
      {justBought && <p className="success-text">Payment confirmed. Your ticket is ready.</p>}
      <ErrorBox message={error} />
      {!tickets && !error && <Loading />}
      {tickets && tickets.length === 0 && (
        <div className="empty">
          <p>You don't have any tickets yet.</p>
          <Link to="/" className="btn">Find an event</Link>
        </div>
      )}
      <div className="stack">
        {tickets?.map((t) => (
          <TicketCard key={t.id} ticket={t} highlight={t.event_id === justBought} />
        ))}
      </div>
    </div>
  );
}
