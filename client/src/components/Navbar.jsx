import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Gatepass
      </Link>
      <nav className="nav-links">
        <NavLink to="/" end className="hide-mobile">Events</NavLink>
        {user ? (
          <>
            <NavLink to="/tickets">Tickets</NavLink>
            <NavLink to="/manage">Organise</NavLink>
            <button className="link-button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <Link to="/signup" className="btn btn-small">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
