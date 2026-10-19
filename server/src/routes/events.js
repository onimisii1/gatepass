import { Router } from "express";
import { query } from "../db.js";
import { HttpError, optionalAuth, requireAuth } from "../auth.js";
import { issueTicket } from "../tickets.js";

const router = Router();

// Columns every event response includes, plus how many tickets are taken.
const EVENT_COLUMNS = `
  e.id, e.title, e.description, e.venue, e.starts_at, e.capacity, e.price,
  e.organiser_id, u.name as organiser_name,
  (select count(*)::int from tickets t where t.event_id = e.id) as tickets_sold
`;

async function getEvent(id) {
  const { rows } = await query(
    `select ${EVENT_COLUMNS} from events e join users u on u.id = e.organiser_id where e.id = $1`,
    [id]
  );
  if (!rows.length) throw new HttpError(404, "Event not found.");
  return rows[0];
}

export async function requireOrganiser(eventId, userId) {
  const event = await getEvent(eventId);
  if (event.organiser_id !== userId) {
    throw new HttpError(403, "Only the organiser of this event can do that.");
  }
  return event;
}

// GET /events  -> upcoming events (anything that started less than a day ago)
router.get("/", async (req, res) => {
  const { rows } = await query(
    `select ${EVENT_COLUMNS}
     from events e join users u on u.id = e.organiser_id
     where e.starts_at > now() - interval '1 day'
     order by e.starts_at asc
     limit 200`
  );
  res.json({ events: rows });
});

// GET /events/:id  -> one event, plus your ticket if you're logged in
router.get("/:id", optionalAuth, async (req, res) => {
  const event = await getEvent(req.params.id);
  let myTicket = null;
  if (req.user) {
    const { rows } = await query(
      "select code, status, checked_in_at from tickets where event_id = $1 and user_id = $2",
      [event.id, req.user.id]
    );
    myTicket = rows[0] || null;
  }
  res.json({
    event,
    myTicket,
    isOrganiser: Boolean(req.user && req.user.id === event.organiser_id),
  });
});

// POST /events  -> create an event (you become its organiser)
router.post("/", requireAuth, async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const venue = String(req.body?.venue || "").trim();
  const startsAt = new Date(req.body?.starts_at);
  const capacity = Number(req.body?.capacity);
  const price = Number(req.body?.price ?? 0);

  if (title.length < 3) throw new HttpError(400, "Give the event a title (at least 3 characters).");
  if (venue.length < 3) throw new HttpError(400, "Please add a venue.");
  if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, "Please pick a valid date and time.");
  if (startsAt.getTime() < Date.now() - 60 * 60 * 1000) throw new HttpError(400, "The event date is in the past.");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    throw new HttpError(400, "Capacity must be a whole number between 1 and 100,000.");
  }
  if (!Number.isInteger(price) || price < 0 || price > 10000000) {
    throw new HttpError(400, "Price must be a whole number of naira (0 for free).");
  }

  const { rows } = await query(
    `insert into events (organiser_id, title, description, venue, starts_at, capacity, price)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [req.user.id, title, description, venue, startsAt.toISOString(), capacity, price]
  );
  res.status(201).json({ event: await getEvent(rows[0].id) });
});

// POST /events/:id/register  -> free events only; paid events go through /pay
router.post("/:id/register", requireAuth, async (req, res) => {
  const event = await getEvent(req.params.id);
  if (event.price > 0) throw new HttpError(402, "This is a paid event. Please pay to get your ticket.");
  const { ticket, alreadyHad } = await issueTicket(event.id, req.user.id);
  res.status(alreadyHad ? 200 : 201).json({ ticket });
});

// GET /events/:id/stats  -> organiser's live dashboard numbers
router.get("/:id/stats", requireAuth, async (req, res) => {
  const event = await requireOrganiser(req.params.id, req.user.id);
  const counts = await query(
    `select count(*)::int as registered,
            count(*) filter (where status = 'checked_in')::int as checked_in
     from tickets where event_id = $1`,
    [event.id]
  );
  const recent = await query(
    `select u.name, t.checked_in_at
     from tickets t join users u on u.id = t.user_id
     where t.event_id = $1 and t.status = 'checked_in'
     order by t.checked_in_at desc limit 8`,
    [event.id]
  );
  res.json({ capacity: event.capacity, ...counts.rows[0], recent: recent.rows });
});

export default router;
