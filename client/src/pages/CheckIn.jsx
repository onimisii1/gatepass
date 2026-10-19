import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../lib/api.js";
import { formatTime } from "../lib/format.js";
import { ErrorBox, Loading } from "../components/Status.jsx";

const READER_ID = "qr-reader";

export default function CheckIn() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // last scan outcome
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState("");

  // Refs hold values that change without needing to redraw the page.
  const busyRef = useRef(false);
  const lastScanRef = useRef({ code: null, at: 0 });

  const loadStats = useCallback(() => {
    return api(`/events/${id}/stats`).then(setStats).catch((err) => setError(err.message));
  }, [id]);

  // Load the event once, then refresh the headcount every 3 seconds,
  // so several phones at different doors all see the same live number.
  useEffect(() => {
    api(`/events/${id}`)
      .then((data) => setEvent(data.event))
      .catch((err) => setError(err.message));
    loadStats();
    const timer = setInterval(loadStats, 3000);
    return () => clearInterval(timer); // stop when leaving the page
  }, [id, loadStats]);

  const checkIn = useCallback(
    async (rawCode) => {
      const code = rawCode.trim().toUpperCase();
      if (!code || busyRef.current) return;

      // The camera sees the same QR many times a second: ignore repeats for 3s.
      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < 3000) return;
      lastScanRef.current = { code, at: now };

      busyRef.current = true;
      try {
        const res = await api("/checkin", { method: "POST", body: { event_id: id, code } });
        setResult(res);
        if (navigator.vibrate) navigator.vibrate(res.result === "ok" ? 80 : [60, 60, 60]);
        loadStats();
      } catch (err) {
        setResult({ result: "invalid", message: err.message });
      } finally {
        busyRef.current = false;
      }
    },
    [id, loadStats]
  );

  // Start the camera when cameraOn becomes true; stop it when false or when leaving.
  useEffect(() => {
    if (!cameraOn) return;
    const scanner = new Html5Qrcode(READER_ID);
    const starting = scanner
      .start(
        { facingMode: "environment" }, // back camera on phones
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => checkIn(decodedText),
        () => {} // "no QR in this frame": ignore
      )
      .catch(() => {
        setCameraError("Couldn't open the camera. Allow camera access, or type the code below.");
        setCameraOn(false);
      });

    return () => {
      starting
        .then(() => (scanner.isScanning ? scanner.stop() : null))
        .catch(() => {})
        .finally(() => {
          try { scanner.clear(); } catch { /* already cleared */ }
        });
    };
  }, [cameraOn, checkIn]);

  function handleManual(e) {
    e.preventDefault();
    lastScanRef.current = { code: null, at: 0 }; // typed codes always go through
    checkIn(manualCode);
    setManualCode("");
  }

  if (error && !event) {
    return (
      <div className="page narrow">
        <ErrorBox message={error} />
        <Link to="/manage" className="btn btn-ghost">Back to your events</Link>
      </div>
    );
  }
  if (!event) return <Loading />;

  const percent = stats ? Math.round((stats.checked_in / Math.max(stats.registered, 1)) * 100) : 0;

  return (
    <div className="page narrow">
      <Link to={`/events/${id}`} className="back">← {event.title}</Link>
      <h1>Door check-in</h1>

      <section className="counter">
        <div className="counter-number">
          <span className="big-number">{stats?.checked_in ?? "–"}</span>
          <span className="muted">/ {stats?.registered ?? "–"} checked in</span>
        </div>
        <div className="progress"><div className="progress-bar" style={{ width: `${percent}%` }} /></div>
        <p className="muted small"><span className="live-dot" /> Live · updates every 3 seconds</p>
      </section>

      {result && (
        <div className={`scan-result scan-${result.result}`} role="status">
          {result.result === "ok" && (
            <>
              <strong>✓ Welcome, {result.name}</strong>
              <span>{result.code}</span>
            </>
          )}
          {result.result === "already" && (
            <>
              <strong>⚠ Already checked in</strong>
              <span>{result.name} came in at {formatTime(result.checked_in_at)}</span>
            </>
          )}
          {result.result === "invalid" && (
            <>
              <strong>✕ Not valid</strong>
              <span>{result.message}</span>
            </>
          )}
        </div>
      )}

      <section className="scanner">
        <div id={READER_ID} className={cameraOn ? "reader on" : "reader"} />
        <button className="btn btn-block" onClick={() => { setCameraError(null); setCameraOn(!cameraOn); }}>
          {cameraOn ? "Stop camera" : "Start scanning"}
        </button>
        <ErrorBox message={cameraError} />
      </section>

      <form onSubmit={handleManual} className="manual">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or type a code: GP-…"
          autoCapitalize="characters"
        />
        <button className="btn">Check in</button>
      </form>

      {stats?.recent?.length > 0 && (
        <section>
          <h2 className="small-heading">Just arrived</h2>
          <ul className="recent">
            {stats.recent.map((r, i) => (
              <li key={i}>
                <span>{r.name}</span>
                <span className="muted">{formatTime(r.checked_in_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
