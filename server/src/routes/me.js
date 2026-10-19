import { Router } from "express";
import { query } from "../db.js";
import { HttpError, requireAuth } from "../auth.js";
import { requireOrganiser } from "./events.js";

const router = Router();

// GET /me/tickets  -> every ticket I hold, with its event
router.get("/me/tickets", requireAuth, async (req, res) => {
  const { rows } = await query(
    `select t.id, t.code, t.status, t.checked_in_at, t.created_at,
            e.id as event_id, e.title, e.venue, e.starts_at, e.price
     from tickets t join events e on e.id = t.event_id
     where t.user_id = $1
     order by e.starts_at asc`,
    [req.user.id]
  );
  res.json({ tickets: rows });
});

// GET /me/events  -> events I organise, with ticket counts
router.get("/me/events", requireAuth, async (req, res) => {
  const { rows } = await query(
    `select e.id, e.title, e.venue, e.starts_at, e.capacity, e.price,
            count(t.id)::int as tickets_sold,
            count(t.id) filter (where t.status = 'checked_in')::int as checked_in
     from events e left join tickets t on t.event_id = e.id
     where e.organiser_id = $1
     group by e.id
     order by e.starts_at desc`,
    [req.user.id]
  );
  res.json({ events: rows });
});

// POST /checkin  { event_id, code }  -> the organiser scans a ticket at the door.
// Always answers 200 with a "result", because a rejected ticket is a normal
// outcome at the door, not a server error.
router.post("/checkin", requireAuth, async (req, res) => {
  const eventId = String(req.body?.event_id || "");
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!code) throw new HttpError(400, "No ticket code was scanned.");

  await requireOrganiser(eventId, req.user.id);

  // Mark it used ONLY if it is still valid. Doing the check and the update in
  // one statement means a ticket can never be let in twice, even if it is
  // scanned on two phones at the same moment.
  const updated = await query(
    `with t as (
       update tickets set status = 'checked_in', checked_in_at = now()
       where code = $1 and event_id = $2 and status = 'valid'
       returning *
     )
     select t.code, t.checked_in_at, u.name from t join users u on u.id = t.user_id`,
    [code, eventId]
  );
  if (updated.rows.length) {
    const row = updated.rows[0];
    return res.json({ result: "ok", name: row.name, code: row.code, checked_in_at: row.checked_in_at });
  }

  // Not let in: work out why.
  const found = await query(
    `select t.event_id, t.status, t.checked_in_at, u.name
     from tickets t join users u on u.id = t.user_id where t.code = $1`,
    [code]
  );
  const ticket = found.rows[0];
  if (!ticket) return res.json({ result: "invalid", message: "This is not a Gatepass ticket." });
  if (ticket.event_id !== eventId) {
    return res.json({ result: "invalid", message: "This ticket is for a different event." });
  }
  return res.json({ result: "already", name: ticket.name, code, checked_in_at: ticket.checked_in_at });
});

export default router;
