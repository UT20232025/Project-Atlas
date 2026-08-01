import type { UpcomingMacroEvent } from "@/lib/atlas/macroCalendarEngine";

type MacroEventsCardProps = {
  events: UpcomingMacroEvent[];
};

function formatCountdown(hoursUntil: number): string {
  if (hoursUntil < 24) {
    return `${hoursUntil}h`;
  }

  const days = Math.floor(hoursUntil / 24);
  const hours = hoursUntil % 24;

  return `${days}d ${hours}h`;
}

export default function MacroEventsCard({
  events,
}: MacroEventsCardProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="atlas-card mb-8 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Upcoming Macro Events</h2>
        <p className="mt-1 text-sm text-zinc-500">
          High-impact events that can move the market — plan around
          them, not through them
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {events.map((event) => (
          <div
            key={event.date}
            className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4"
          >
            <div>
              <p className="font-semibold text-yellow-300">
                {event.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(event.date).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </p>
            </div>

            <span className="rounded-full border border-yellow-500/30 px-3 py-1 text-sm font-semibold text-yellow-300">
              {formatCountdown(event.hoursUntil)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
