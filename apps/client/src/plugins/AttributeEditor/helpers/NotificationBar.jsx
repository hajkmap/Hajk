import React from "react";

export default function NotificationBar({ s, theme, text }) {
  if (!text) return null;
  return (
    <div style={s.notification} role="status" aria-live="polite">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.primary}
        strokeWidth="2"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      {text}
    </div>
  );
}
