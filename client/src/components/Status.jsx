export function Loading({ text = "Loading…" }) {
  return <p className="muted center pad">{text}</p>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <p className="error-box" role="alert">{message}</p>;
}
