import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "h-16 w-16 text-yellow-400"}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M11.25 2.25a.75.75 0 00-1.5 0v1.163c-.395.066-.77.17-1.125.318-1.125.48-1.875 1.67-1.875 2.94V10.5h3.375c.345 0 .68.056 1 .162V6.67c0-1.27-.75-2.46-1.875-2.94a4.343 4.343 0 00-1.125-.318V2.25zM8.625 12H5.25V6.67c0-1.27.75-2.46 1.875-2.94a4.32 4.32 0 012.25 0c1.125.48 1.875 1.67 1.875 2.94V12h-3.375c-.345 0-.68-.056-1-.162zM5.25 13.5c0 .828.672 1.5 1.5 1.5h6.5a1.5 1.5 0 001.5-1.5V12H5.25v1.5zM4.5 9H2.25a.75.75 0 000 1.5H4.5V9zm13.5 1.5H15.5V9h2.25a.75.75 0 010 1.5z"
      clipRule="evenodd"
    />
    <path d="M4 16.5A2.5 2.5 0 006.5 19h7a2.5 2.5 0 002.5-2.5V16h-12v.5z" />
  </svg>
);