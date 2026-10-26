export function RosetteMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="7" />
      <circle cx="32" cy="13" r="5" />
      <circle cx="48" cy="23" r="5" />
      <circle cx="42" cy="47" r="5" />
      <circle cx="22" cy="47" r="5" />
      <circle cx="16" cy="23" r="5" />
    </svg>
  );
}
