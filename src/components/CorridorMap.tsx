"use client";

import { useEffect, useRef, useState } from "react";
import { places } from "@/lib/data";
import { border, cities, labels, lakes, mapSize, rivers, routes } from "@/lib/mapData";

type RouteKey = keyof typeof routes;

// A trip is one line from the crossing to the city, cut from the highways it follows.
const until = (d: string, [x, y]: number[]) => {
  const at = d.indexOf(`${x} ${y}C`);
  return at < 0 ? d : d.slice(0, at + `${x} ${y}`.length);
};
const onward = (d: string) => d.replace(/^M[^C]*/, "");
const fork = routes.qew.d.match(/[\d.]+/g)!.slice(0, 2).map(Number); // where the 403 leaves the 401
const { hwy401, i75s, i94, i96, qew, turnpike } = routes;

// Approximate road distances from Windsor. Detroit is the crossing itself: on the map it is the
// same dot as Windsor, so it is drawn in the enlarged view of the crossing instead.
type Destination = { name: string; via: string; km: number; mi: number; trip?: string; end?: number[] };
const destinations: Destination[] = [
  { name: "Detroit", via: "Ambassador Bridge", km: 5, mi: 3 },
  { name: "London", via: "Hwy 401", km: 190, mi: 120, trip: until(hwy401.d, cities.london) },
  { name: "Toronto", via: "Hwy 401", km: 370, mi: 230, trip: hwy401.d },
  { name: "Buffalo", via: "Hwy 401, 403, QEW", km: 400, mi: 250, trip: until(hwy401.d, fork) + onward(qew.d) },
  { name: "Toledo", via: "I-75", km: 95, mi: 60, trip: i75s.d },
  { name: "Cleveland", via: "I-75, I-80/90", km: 270, mi: 170, trip: i75s.d + onward(turnpike.d) },
  { name: "Grand Rapids", via: "I-96", km: 255, mi: 160, trip: i96.d },
  { name: "Chicago", via: "I-94", km: 455, mi: 285, trip: i94.d },
].map((d: Destination) => ({ ...d, end: d.trip?.match(/[\d.]+/g)!.slice(-2).map(Number) }));
/** "Detroit" as the quote form writes it: "Detroit, MI". */
const placeOf = (name: string) => places.find((p) => p.startsWith(`${name},`)) ?? name;

// [city, label, dx, dy, anchor, hide on small screens]
const cityLabels: [keyof typeof cities, string, number, number, "start" | "middle" | "end", boolean][] = [
  ["toronto", "Toronto", 0, 30, "middle", false],
  ["london", "London", -10, -12, "end", false],
  ["buffalo", "Buffalo", 0, 30, "middle", false],
  ["cleveland", "Cleveland", 0, 30, "middle", false],
  ["toledo", "Toledo", -12, 6, "end", false],
  ["chicago", "Chicago", 12, -14, "start", false],
  ["grandRapids", "Grand Rapids", 0, -14, "middle", true],
  ["flint", "Flint", -11, -4, "end", true],
  ["lansing", "Lansing", 0, 28, "middle", true],
];

// Each highway and its place in the entrance. The roads that continue from another wait for it to arrive.
const order: [RouteKey, number][] = [
  ["hwy401", 0],
  ["i75s", 1],
  ["i94", 2],
  ["i75n", 3],
  ["i96", 4],
  ["qew", 5],
  ["i75ohio", 8],
  ["turnpike", 8],
];

export function CorridorMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"static" | "armed" | "drawn">("static");
  // Pointing at or tabbing to a city previews its road; clicking keeps it.
  const [peek, setPeek] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const hot = peek ?? picked;
  // A road draws itself only when the map goes from nothing chosen to something chosen by pointer.
  // Moving on to the next city, coming back to the kept one, or arriving by keyboard shows it at once.
  const [atOnce, setAtOnce] = useState(false);

  // The map arrives drawn. If it has not been seen yet, hold the highways back and draw them when it is.
  useEffect(() => {
    let armed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!armed) {
          if (entry.boundingClientRect.top < window.innerHeight) return io.disconnect();
          armed = true;
          setPhase("armed");
        } else if (entry.intersectionRatio >= 0.29) {
          setPhase("drawn");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  const trip = hot === null ? null : destinations[hot];
  const across = trip !== null && !trip.trip; // Detroit: over the bridge, not along a highway
  const now = atOnce ? " map-trip-now" : "";
  const [cx, cy] = cities.crossing;

  return (
    <div ref={ref} data-phase={phase} className="map grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-center lg:gap-14">
      {/* On a phone the list is longer than the screen, so the map stays pinned under the header:
          tap a city anywhere in the list and its road is still in view. */}
      <div className="max-sm:sticky max-sm:top-16 max-sm:z-10 max-sm:-mx-5 max-sm:bg-navy-deep max-sm:px-5 max-sm:pt-3 max-sm:pb-2 max-sm:after:pointer-events-none max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:top-full max-sm:after:h-5 max-sm:after:bg-gradient-to-b max-sm:after:from-navy-deep max-sm:after:to-transparent max-sm:after:content-['']">
      <svg
        viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
        role="img"
        aria-label="Map of the Great Lakes region. Detroit is across the river from Windsor, and highways fan out from the crossing: Highway 401 east to London and Toronto, I-75 south to Toledo and north to Flint, I-94 west to Chicago, and I-96 to Grand Rapids."
        className="w-full overflow-hidden rounded-plate bg-navy"
      >
        <g className="fill-navy-deep">
          {lakes.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-navy-deep">
          {rivers.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={border} fill="none" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" className="stroke-white/30" />

        <g className="map-fade fill-white/25 max-sm:hidden" fontSize="16" fontWeight="600" letterSpacing="3" textAnchor="middle">
          <text x={labels.ontario[0]} y={labels.ontario[1]}>ONTARIO</text>
          <text x={labels.michigan[0]} y={labels.michigan[1]}>MICHIGAN</text>
          <text x={labels.ohio[0]} y={labels.ohio[1]}>OHIO</text>
          <text x={labels.indiana[0]} y={labels.indiana[1]}>INDIANA</text>
        </g>
        <g className="map-fade fill-mist/60 max-sm:hidden" fontSize="17" fontStyle="italic" textAnchor="middle">
          <text x={labels.erie[0] + 70} y={labels.erie[1] - 6}>Lake Erie</text>
          <text x={labels.huron[0]} y={labels.huron[1]}>Lake Huron</text>
          <text x={labels.lakeMichigan[0]} y={labels.lakeMichigan[1]}>Lake Michigan</text>
        </g>

        <g className="stroke-white/[0.045]" strokeWidth="1">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2={mapSize.h} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * 100} x2={mapSize.w} y2={(i + 1) * 100} />
          ))}
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {order.map(([key, i]) => (
            <path key={`glow-${key}`} d={routes[key].d} pathLength={1} style={{ "--i": i } as React.CSSProperties} className="map-route stroke-fender opacity-70" strokeWidth="11" />
          ))}
          {order.map(([key, i]) => (
            <path
              key={key}
              d={routes[key].d}
              pathLength={1}
              style={{ "--i": i } as React.CSSProperties}
              className={`map-route stroke-white ${trip ? "opacity-30" : "opacity-100"}`}
              strokeWidth="3"
            />
          ))}
        </g>

        {/* under the city names, so the chosen road never crosses the lettering */}
        {trip?.trip && (
          <path key={`road-${trip.name}`} d={trip.trip} pathLength={1} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className={`map-trip-line stroke-amber${now}`} />
        )}

        <g className="map-fade">
          {cityLabels.map(([key, name, dx, dy, anchor, small]) => {
            const [x, y] = cities[key];
            return (
              <g key={key} className={small ? "max-sm:hidden" : undefined}>
                <circle cx={x} cy={y} r="5" className="fill-navy stroke-white" strokeWidth="2.5" />
                <text x={x + dx} y={y + dy} textAnchor={anchor} className="map-city fill-white">
                  {name}
                </text>
              </g>
            );
          })}
        </g>

        {trip?.end && <circle key={`dot-${trip.name}`} cx={trip.end[0]} cy={trip.end[1]} r="7" strokeWidth="3" className={`map-trip-dot fill-amber stroke-navy-deep${now}`} />}

        {/* The crossing, enlarged. Detroit really is north of Windsor here. */}
        <g className="map-fade max-sm:hidden">
          <line x1={cx + 10} y1={cy + 6} x2="806" y2="536" strokeWidth="1.5" className="stroke-amber/60" />
          <clipPath id="crossing-inset">
            <circle cx="880" cy="575" r="86" />
          </clipPath>
          <g clipPath="url(#crossing-inset)">
            <rect x="790" y="485" width="180" height="180" className="fill-navy-raised" />
            <path d="M790 566 C 840 552, 900 596, 970 560 L970 600 C 900 636, 840 590, 790 606 Z" className="fill-navy-deep" />
            <line x1="872" y1="534" x2="888" y2="628" strokeWidth="5" strokeLinecap="round" className="stroke-white" />
            {across && <line x1="888" y1="628" x2="872" y2="534" pathLength={1} strokeWidth="5" strokeLinecap="round" className={`map-trip-line stroke-amber${now}`} />}
            <circle cx="872" cy="534" r="6" className="fill-white" />
            {across && <circle cx="872" cy="534" r="8" strokeWidth="3" className={`map-trip-dot fill-amber stroke-navy-deep${now}`} />}
            <circle cx="888" cy="628" r="6" className="fill-amber" />
            <text x="885" y="530" className="map-inset fill-white">Detroit</text>
            <text x="875" y="625" textAnchor="end" className="map-inset fill-white">Windsor</text>
          </g>
          <circle cx="880" cy="575" r="86" fill="none" strokeWidth={across ? 4 : 2} className="map-ring stroke-amber" />
        </g>

        {/* on a phone the enlarged view is too small to show, so the crossing itself answers */}
        {across && <circle cx={cx} cy={cy} r="18" strokeWidth="3" className={`map-trip-dot fill-none stroke-amber${now}`} />}

        <circle cx={cx} cy={cy} r="12" className="map-ping fill-none stroke-amber" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="9" className="fill-amber stroke-navy-deep" strokeWidth="3" />
        <text x={cx + 16} y={cy + 34} className={`map-home ${across ? "fill-amber" : "fill-white"}`}>
          Windsor–Detroit
        </text>
      </svg>
      </div>

      <div
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          setAtOnce(true);
          setPeek(null);
        }}
      >
        <h3 className="font-semibold text-mist">Approximate road distance from Windsor</h3>
        <ul className="mt-3 border-t border-white/15">
          {destinations.map((d, i) => (
            <li key={d.name} className="border-b border-white/15">
              <button
                type="button"
                aria-pressed={picked === i}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  setAtOnce(hot !== null);
                  setPeek(i);
                }}
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) setAtOnce(true);
                  setPeek(i);
                }}
                onBlur={() => {
                  setAtOnce(true);
                  setPeek((p) => (p === i ? null : p));
                }}
                onClick={() => {
                  if (hot !== i) setAtOnce(hot !== null);
                  setPicked(picked === i ? null : i);
                  if (picked === i) setPeek(null);
                }}
                className="flex w-full items-center gap-3 py-3 text-left active:bg-white/[0.06]"
              >
                {/* the same marker the city has on the map: ringed when pointed at, filled when kept */}
                <span
                  aria-hidden
                  className={`size-2.5 shrink-0 rounded-full border-2 transition-colors duration-150 ${picked === i ? "border-amber bg-amber" : hot === i ? "border-amber" : "border-white/60"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`display text-2xl transition-colors duration-150 ${hot === i ? "text-amber" : "text-white"}`}>{d.name}</span>
                  <span className="ml-3 text-sm text-mist max-sm:ml-0 max-sm:block">{d.via}</span>
                </span>
                <span className="shrink-0 text-right text-white tabular-nums">
                  {d.km} km <span className="text-mist">· {d.mi} mi</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <a
          href="#quote"
          onClick={() => hot !== null && window.dispatchEvent(new CustomEvent("quote-lane", { detail: placeOf(destinations[hot].name) }))}
          className="btn btn-light mt-6 w-full"
        >
          {hot === null ? "Get a quote for your lane" : `Get a quote to ${destinations[hot].name}`}
        </a>
      </div>
    </div>
  );
}
