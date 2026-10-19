import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatPrice, formatTime } from "../lib/format.js";

// A ticket the attendee shows at the door. The QR code holds the ticket code.
export default function TicketCard({ ticket, highlight = false }) {
  const used = ticket.status === "checked_in";
  return (
    <article className={`ticket ticket-pass${highlight ? " highlight" : ""}${used ? " used" : ""}`}>
      <div className="ticket-main column">
        <p className="eyebrow">Admit one</p>
        <h3 className="event-title">{ticket.title}</h3>
        <p className="event-meta">{formatDate(ticket.starts_at)} · {formatTime(ticket.starts_at)}</p>
        <p className="event-meta">{ticket.venue}</p>
        <p className="event-meta small">{formatPrice(ticket.price)}</p>
        {used && <span className="stamp">Checked in {formatTime(ticket.checked_in_at)}</span>}
      </div>
      <div className="ticket-stub qr-stub">
        <div className="qr-box">
          <QRCodeSVG value={ticket.code} size={148} level="M" marginSize={0} />
        </div>
        <code className="ticket-code">{ticket.code}</code>
      </div>
    </article>
  );
}
