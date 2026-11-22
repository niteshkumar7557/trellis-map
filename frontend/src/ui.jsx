import { Link } from "react-router-dom";
import { useTheme } from "./theme.js";

// Small pieces every screen shares: the mark, the theme switch and a few icons.

// The mark: a stem with three rungs, like the map's steps.
export function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand">
      <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="11" y="2" width="2" height="20" rx="1" />
        <rect x="5" y="5" width="14" height="3" rx="1.5" />
        <rect x="3" y="11" width="18" height="3" rx="1.5" />
        <rect x="7" y="17" width="10" height="3" rx="1.5" />
      </svg>
      Trellis
    </Link>
  );
}

export function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
