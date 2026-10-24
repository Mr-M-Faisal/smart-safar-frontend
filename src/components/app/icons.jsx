const paths = {
  Home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  Map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></>,
  Routes: <><path d="M5 5h14M5 12h14M5 19h14" /><circle cx="3" cy="5" r=".8" /><circle cx="3" cy="12" r=".8" /><circle cx="3" cy="19" r=".8" /></>,
  Ticket: <><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6z" /><path d="M12 7v2m0 3v2m0 3v1" /></>,
  Trips: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10m-10 4h10m-10 4h6" /></>,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.8 7.8 0 0 1-1.4.8l-.3 1.8h-2.8l-.3-1.8a7.8 7.8 0 0 1-1.4-.8l-1.7.6-1.4-2.4 1.4-1.1a7.5 7.5 0 0 1 0-1.6l-1.4-1.1 1.4-2.4 1.7.6a7.8 7.8 0 0 1 1.4-.8l.3-1.8h2.8l.3 1.8a7.8 7.8 0 0 1 1.4.8l1.7-.6 1.4 2.4-1.4 1.1a7.5 7.5 0 0 1 0 1.6Z" /></>,
  User: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.8 7.8 0 0 1-1.4.8l-.3 1.8h-2.8l-.3-1.8a7.8 7.8 0 0 1-1.4-.8l-1.7.6-1.4-2.4 1.4-1.1a7.5 7.5 0 0 1 0-1.6l-1.4-1.1 1.4-2.4 1.7.6a7.8 7.8 0 0 1 1.4-.8l.3-1.8h2.8l.3 1.8a7.8 7.8 0 0 1 1.4.8l1.7-.6 1.4 2.4-1.4 1.1a7.5 7.5 0 0 1 0 1.6Z" /></>,
  Back: <><path d="m15 18-6-6 6-6M9 12h12" /></>,
  Search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
  Locate: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  Bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" /></>,
  Share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m9 11 6-5m-6 8 6 4" /></>,
  Report: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v5m0 3v.01" /></>,
  Bus: <><path d="M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10M5 11h14M7 16h10l2 3H5z" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></>,
  Seat: <><path d="M7 4v9a2 2 0 0 0 2 2h8v5M7 13H5a2 2 0 0 0-2 2v2h14" /><path d="M11 6h7v7h-7z" /></>,
  Moon: <><path d="M20.8 13A8.5 8.5 0 0 1 11 3.2 8.5 8.5 0 1 0 20.8 13Z" /></>,
  Sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
};

export default function AppIcon({ name, size = 20, className = "" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name] || paths.Home}</svg>;
}
