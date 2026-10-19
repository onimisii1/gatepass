import { Router } from "express";
import crypto from "node:crypto";
import { query } from "../db.js";
import { HttpError, requireAuth } from "../auth.js";
import { issueTicket } from "../tickets.js";

const router = Router();

const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const DEMO_PAYMENTS = process.env.DEMO_PAYMENTS === "true";
const APP_URL = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

async function paystack(path, options = {}) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.status) {
    throw new HttpError(502, body.message || "Could not reach Paystack. Please try again.");
  }
  return body.data;
}

async function getPaidEvent(eventId, userId) {
  const { rows } = await query(
    `select e.*, (select count(*)::int from tickets t where t.event_id = e.id) as tickets_sold,
            exists(select 1 from tickets t where t.event_id = e.id and t.user_id = $2) as already_has
     from events e where e.id = $1`,
    [eventId, userId]
  );
  const event = rows[0];
  if (!event) throw new HttpError(404, "Event not found.");
  if (event.price <= 0) throw new HttpError(400, "This event is free. Just register.");
  if (event.already_has) throw new HttpError(409, "You already have a ticket for this event.");
  if (event.tickets_sold >= event.capacity) throw new HttpError(409, "Sorry, this event is sold out.");
  return event;
}

// GET /payments/config  -> lets the app know which payment mode is on
router.get("/payments/config", (req, res) => {
  res.json({ paystack: Boolean(PAYSTACK_KEY), demo: !PAYSTACK_KEY && DEMO_PAYMENTS });
});

// POST /events/:id/pay  -> start a payment.
// With Paystack: returns a checkout link; Paystack sends the user back to the app afterwards.
// In demo mode: issues the ticket straight away.
router.post("/events/:id/pay", requireAuth, async (req, res) => {
  const event = await getPaidEvent(req.params.id, req.user.id);

  if (!PAYSTACK_KEY) {
    if (!DEMO_PAYMENTS) throw new HttpError(503, "Payments are not set up yet.");
    const ref = "DEMO-" + crypto.randomBytes(6).toString("hex");
    const { ticket } = await issueTicket(event.id, req.user.id, ref);
    return res.status(201).json({ mode: "demo", ticket });
  }

  const data = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: req.user.email,
      amount: event.price * 100, // Paystack counts in kobo
      currency: "NGN",
      callback_url: `${APP_URL}/?pay_event=${event.id}`,
      metadata: { event_id: event.id, user_id: req.user.id },
    }),
  });
  res.json({ mode: "paystack", authorization_url: data.authorization_url });
});

// POST /payments/verify  { reference }  -> after Paystack sends the user back.
// Never trust the browser's word that it paid: ask Paystack directly.
router.post("/payments/verify", requireAuth, async (req, res) => {
  const reference = String(req.body?.reference || "").trim();
  if (!reference) throw new HttpError(400, "Missing payment reference.");
  if (!PAYSTACK_KEY) throw new HttpError(503, "Payments are not set up.");

  // Already used? (e.g. the user refreshed the page) -> return the same ticket.
  const used = await query("select * from tickets where payment_ref = $1", [reference]);
  if (used.rows.length) {
    if (used.rows[0].user_id !== req.user.id) throw new HttpError(409, "This payment has already been used.");
    return res.json({ ticket: used.rows[0] });
  }

  const data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  let meta = data.metadata || {};
  if (typeof meta === "string") {
    try { meta = JSON.parse(meta); } catch { meta = {}; }
  }

  if (data.status !== "success") throw new HttpError(402, "The payment was not completed.");
  if (meta.user_id !== req.user.id) throw new HttpError(403, "This payment belongs to another account.");

  const { rows } = await query("select * from events where id = $1", [meta.event_id]);
  const event = rows[0];
  if (!event) throw new HttpError(404, "Event not found.");
  if (data.currency !== "NGN" || data.amount !== event.price * 100) {
    throw new HttpError(400, "The amount paid does not match the ticket price.");
  }

  const { ticket } = await issueTicket(event.id, req.user.id, reference);
  res.status(201).json({ ticket });
});

export default router;
