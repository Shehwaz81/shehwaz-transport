import { company } from "@/lib/data";
import { cn } from "@/lib/utils";

export function DoorDecal({ className }: { className?: string }) {
  const lines =
    company.authority.length > 0
      ? company.authority.map((a) => `${a.label} ${a.number}`)
      : ["Dry van", "Canada & USA"];

  return (
    <div className={cn("decal", className)}>
      <p className="text-[1.3em]">{company.legalName}</p>
      <p>{company.city}</p>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
