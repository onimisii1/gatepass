// One helper for every call to the Gatepass API.
// It adds the login token, sends/reads JSON, and turns API errors into
// normal JavaScript errors with a readable message.

const LIVE_API = "https://gatepass-aiad.onrender.com";
const onLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Priority: the VITE_API_URL build setting, then localhost while developing,
// then the live server (so the deployed site works even if the setting is missing).
export const API_URL = (
  import.meta.env.VITE_API_URL || (onLocalhost ? "http://localhost:4000" : LIVE_API)
).replace(/\/$/, "");

const TOKEN_KEY = "gatepass_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked (private mode): the user just stays logged in for this tab
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const options = {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  // The free server sleeps when unused and takes up to a minute to wake.
  // While it wakes, requests fail, so keep retrying for about 60 seconds.
  let response;
  for (let attempt = 1; ; attempt++) {
    try {
      response = await fetch(API_URL + path, options);
      if (response.status !== 502 && response.status !== 503) break; // 502/503 = still waking
    } catch {
      // network error: server asleep or unreachable
    }
    if (attempt >= 7) {
      if (response) break;
      throw new Error(`Can't reach the Gatepass server (${API_URL}). Check your connection and try again.`);
    }
    await wait(10000);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}