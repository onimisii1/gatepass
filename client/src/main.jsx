import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth.jsx";
import App from "./App.jsx";
import "./styles.css";

// HashRouter keeps page addresses after a "#" (e.g. /gatepass/#/tickets).
// GitHub Pages only serves real files, and this way every page loads index.html.
createRoot(document.getElementById("root")).render(
  <HashRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HashRouter>
);
