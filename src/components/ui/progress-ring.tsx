type ProgressRingProps = {
  value: number;
  size?: number;
  color?: "rose" | "teal";
};

export function ProgressRing({ value, size = 84, color = "rose" }: ProgressRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
  const stroke = color === "rose" ? "var(--rose-500)" : "var(--teal-500)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(17,24,39,0.08)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-[var(--foreground)] text-[18px] font-semibold">
        {value}%
      </text>
    </svg>
  );
}

