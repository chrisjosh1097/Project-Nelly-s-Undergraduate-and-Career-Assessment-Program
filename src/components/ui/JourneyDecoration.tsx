/** Decorative only: no text, controls, network requests or motion. */
export function JourneyDecoration() {
  return <div data-decoration="journey" aria-hidden="true" className="journey-decoration">
    <svg viewBox="0 0 440 440" fill="none" focusable="false">
      <circle cx="220" cy="220" r="190" stroke="#E8CDBD" strokeDasharray="4 12" />
      <path d="M50 320C160 330 95 90 240 100S290 350 395 230" stroke="#D77850" strokeWidth="2" strokeDasharray="7 9" />
      <circle cx="50" cy="320" r="9" fill="#BC340E" />
      <circle cx="395" cy="230" r="7" fill="#BC340E" />
      <g transform="translate(317 30) rotate(12 30 30)">
        <rect width="60" height="60" rx="18" fill="#FFFDFC" stroke="#E8CDBD" />
        <path d="M30 12L38 30L30 48L22 30Z" fill="#BC340E" />
        <path d="M30 12V48L22 30Z" fill="#F2B797" />
      </g>
      <g transform="translate(15 102) rotate(-12 24 24)">
        <rect width="48" height="48" rx="14" fill="#191817" />
        <path d="M14 14H24V34H14V14ZM24 14H34V34H24" stroke="#FFF4E9" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M376 342V364M365 353H387M90 40V56M82 48H98" stroke="#BC340E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>;
}
