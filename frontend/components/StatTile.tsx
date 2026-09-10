export function StatTile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="text-right">
      <p className="text-xs font-medium text-brand-700">{label}</p>
      <p className="text-2xl font-semibold text-brand-950">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-brand-600">{unit}</span>}
      </p>
    </div>
  );
}
