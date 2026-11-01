/** Icons from the Phase 1 design (24×24 grid, 2px stroke). Always decorative (aria-hidden); meaning is carried by adjacent text. */
const PATHS = {
  'trend-up': 'M3 17l6-6 4 4 8-8M15 7h6v6',
  'trend-down': 'M3 7l6 6 4-4 8 8M15 17h6v-6',
  'trend-flat': 'M3 12h18M17 8l4 4-4 4',
  alert: 'M12 3L2 21h20L12 3zM12 10v5M12 18h.01',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11v6M12 7.5h.01',
  table: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M3 15h18M9 4v16',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  keyboard: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  synthetic: 'M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3',
  error: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9 9l6 6M15 9l-6 6',
  ok: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 12l3 3 5-6',
  'chevron-down': 'M6 9l6 6 6-6',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  partial: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 3v18M12 7h6M12 12h9M12 17h6',
  'out-of-range': 'M5 3h14M12 21V7M7 12l5-5 5 5',
  more: 'M12 5h.01M12 12h.01M12 19h.01',
  close: 'M6 6l12 12M18 6L6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
  sound: 'M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  density: 'M4 6h16M4 12h16M4 18h16',
  reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5',
  check: 'M5 12l5 5 9-10',
  menu: 'M4 6h16M4 12h16M4 18h16',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  'arrow-down': 'M12 5v14M6 13l6 6 6-6',
  'arrow-updown': 'M8 9l4-4 4 4M8 15l4 4 4-4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className ?? ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
