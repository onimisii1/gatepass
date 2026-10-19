import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { ErrorBox } from "../components/Status.jsx";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", venue: "", starts_at: "", capacity: "100", price: "0",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api("/events", {
        method: "POST",
        body: {
          ...form,
          // the date box gives local time like "2026-11-14T18:00"; send it as a full timestamp
          starts_at: new Date(form.starts_at).toISOString(),
          capacity: Number(form.capacity),
          price: Number(form.price),
        },
      });
      navigate(`/events/${data.event.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="ticket form-ticket">
        <div className="ticket-main column">
          <p className="eyebrow">Host</p>
          <h1>Create an event</h1>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Event name
              <input value={form.title} onChange={update("title")} required minLength={3} placeholder="Lagos Tech Fest" />
            </label>
            <label>
              Description <span className="hint">(optional)</span>
              <textarea value={form.description} onChange={update("description")} rows={3} />
            </label>
            <label>
              Venue
              <input value={form.venue} onChange={update("venue")} required placeholder="Landmark Centre, Lagos" />
            </label>
            <label>
              Date and time
              <input type="datetime-local" value={form.starts_at} onChange={update("starts_at")} required />
            </label>
            <div className="row">
              <label>
                Capacity
                <input type="number" min="1" step="1" value={form.capacity} onChange={update("capacity")} required />
              </label>
              <label>
                Price (₦)
                <input type="number" min="0" step="1" value={form.price} onChange={update("price")} required />
                <span className="hint">0 = free</span>
              </label>
            </div>
            <ErrorBox message={error} />
            <button className="btn btn-block" disabled={busy}>{busy ? "Creating…" : "Create event"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
