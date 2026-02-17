interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export default function MacroProgressBar({ label, current, target, color, unit = "g" }: MacroProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOver = current > target && target > 0;

  const colorMap: Record<string, { bg: string; fill: string; text: string; overFill: string }> = {
    gray: { bg: "bg-gray-200", fill: "bg-gray-600", text: "text-gray-700", overFill: "bg-gray-800" },
    red: { bg: "bg-red-200", fill: "bg-red-500", text: "text-red-700", overFill: "bg-red-700" },
    yellow: { bg: "bg-yellow-200", fill: "bg-yellow-500", text: "text-yellow-700", overFill: "bg-yellow-700" },
    blue: { bg: "bg-blue-200", fill: "bg-blue-500", text: "text-blue-700", overFill: "bg-blue-700" },
  };

  const colors = colorMap[color] || colorMap.gray;

  return (
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class={`text-sm font-medium ${colors.text}`}>{label}</span>
        <span class="text-sm text-gray-600">
          {Math.round(current)}{unit !== "cal" ? unit : ""} / {target}{unit !== "cal" ? unit : ""}{" "}
          {unit === "cal" ? "cal" : ""}
        </span>
      </div>
      <div class={`w-full ${colors.bg} rounded-full h-3`}>
        <div
          class={`${isOver ? colors.overFill : colors.fill} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div class="flex justify-end mt-0.5">
        <span class={`text-xs ${isOver ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
