import { Link } from "react-router-dom";
import { dateParts, formatPrice, formatTime } from "../lib/format.js";

// One event, drawn as a ticket: main part on the left, tear-off stub on the right.
export default function EventCard({ event }) {
  const { day, month } = dateParts(event.starts_at);
  const left = event.capacity - event.tickets_sold;
  const soldOut = left <= 0;

  return (
    <Link to={`/events/${event.id}`} className="ticket event-card">
      <div className="ticket-main">
        <div className="date-block">
          <span className="date-day">{day}</span>
          <span className="date-month">{month}</span>
        </div>
        <div>
          <h3 className="event-title">{event.title}</h3>
          <p className="event-meta">{event.venue} · {formatTime(event.starts_at)}</p>
          <p className="event-meta small">by {event.organiser_name}</p>
        </div>
      </div>
      <div className="ticket-stub">
        <span className="price">{formatPrice(event.price)}</span>
        <span className={soldOut ? "pill pill-red" : left <= 10 ? "pill pill-amber" : "pill"}>
          {soldOut ? "Sold out" : left <= 10 ? `${left} left` : "Get ticket →"}
        </span>
      </div>
    </Link>
  );
}
