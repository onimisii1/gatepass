import crypto from "node:crypto";
import { transaction } from "./db.js";
import { HttpError } from "./auth.js";

// e.g. "GP-7F3A9C21BE": random and unguessable, so tickets can't be forged.
export function newTicketCode() {
  return "GP-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

// Issue a ticket safely. Runs as one transaction and locks the event row,
// so if two people grab the last ticket at the same moment, only one gets it.
// Calling it twice for the same person just returns their existing ticket.
export async function issueTicket(eventId, userId, paymentRef = null) {
  return transaction(async (db) => {
    const eventResult = await db.query("select * from events where id = $1 for update", [eventId]);
    const event = eventResult.rows[0];
    if (!event) throw new HttpError(404, "Event not found.");

    const existing = await db.query(
      "select * from tickets where event_id = $1 and user_id = $2",
      [eventId, userId]
    );
    if (existing.rows.length) return { ticket: existing.rows[0], alreadyHad: true };

    const countResult = await db.query("select count(*)::int as n from tickets where event_id = $1", [eventId]);
    if (countResult.rows[0].n >= event.capacity) {
      throw new HttpError(409, "Sorry, this event is sold out.");
    }

    const { rows } = await db.query(
      `insert into tickets (event_id, user_id, code, payment_ref)
       values ($1, $2, $3, $4) returning *`,
      [eventId, userId, newTicketCode(), paymentRef]
    );
    return { ticket: rows[0], alreadyHad: false };
  });
}
