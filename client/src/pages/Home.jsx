import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import EventCard from "../components/EventCard.jsx";
import { ErrorBox, Loading } from "../components/Status.jsx";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Load events once, when the page first appears.
  useEffect(() => {
    api("/events")
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const term = search.trim().toLowerCase();
  const visible = events.filter(
    (e) => e.title.toLowerCase().includes(term) || e.venue.toLowerCase().includes(term)
  );

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Tickets · QR check-in · Live headcount</p>
        <h1>Get in.<br /><span className="accent">No paper, no wahala.</span></h1>
        <p className="lede">
          Register for events, carry your ticket on your phone, and get scanned in at the door in a second.
        </p>
        <div className="hero-actions">
          <Link to="/events/new" className="btn">Host an event</Link>
          <a href="#events" className="btn btn-ghost">Browse events</a>
        </div>
      </section>

      <section id="events">
        <div className="section-head">
          <h2>Upcoming</h2>
          <input
            className="search"
            type="search"
            placeholder="Search by name or venue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ErrorBox message={error} />
        {loading && <Loading text="Loading events… (the free server can take ~30s to wake up)" />}

        {!loading && !error && visible.length === 0 && (
          <div className="empty">
            {events.length === 0 ? (
              <>
                <p>No upcoming events yet.</p>
                <Link to="/events/new" className="btn">Create the first one</Link>
              </>
            ) : (
              <p>No events match “{search}”.</p>
            )}
          </div>
        )}

        <div className="event-list">
          {visible.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
