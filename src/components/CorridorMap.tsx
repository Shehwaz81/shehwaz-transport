"use client";

import { useEffect, useRef, useState } from "react";
import { border, cities, labels, lakes, mapSize, rivers, routes } from "@/lib/mapData";

type RouteKey = keyof typeof routes;

// Approximate road distances from the Windsor–Detroit crossing.
const destinations: { name: string; via: string; km: number; routes: RouteKey[] }[] = [
  { name: "London", via: "Hwy 401", km: 190, routes: ["hwy401"] },
  { name: "Toronto", via: "Hwy 401", km: 370, routes: ["hwy401"] },
  { name: "Buffalo", via: "Hwy 401, 403 and the QEW", km: 400, routes: ["hwy401", "qew"] },
  { name: "Toledo", via: "I-75", km: 95, routes: ["i75s"] },
  { name: "Cleveland", via: "I-75 and I-80/90", km: 270, routes: ["i75s", "turnpike"] },
  { name: "Grand Rapids", via: "I-96", km: 255, routes: ["i96"] },
  { name: "Chicago", via: "I-94", km: 455, routes: ["i94"] },
];

// [city, label, dx, dy, anchor, hide on small screens]
const cityLabels: [keyof typeof cities, string, number, number, "start" | "middle" | "end", boolean][] = [
  ["toronto", "Toronto", 12, 26, "start", false],
  ["london", "London", -10, -12, "end", false],
  ["buffalo", "Buffalo", 0, 30, "middle", false],
  ["cleveland", "Cleveland", 0, 30, "middle", false],
  ["toledo", "Toledo", -12, 6, "end", false],
  ["chicago", "Chicago", -12, -12, "end", false],
  ["grandRapids", "Grand Rapids", 0, -14, "middle", true],
  ["flint", "Flint", -11, -4, "end", true],
  ["lansing", "Lansing", 0, 28, "middle", true],
];

const order: RouteKey[] = ["hwy401", "i75s", "i94", "i75n", "i96", "turnpike", "qew"];

export function CorridorMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [hot, setHot] = useState<number | null>(null);

  // The highways draw outward from the crossing once, the first time the map is seen.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  const hotRoutes = hot === null ? null : destinations[hot].routes;
  const [cx, cy] = cities.crossing;

  return (
    <div ref={ref} data-drawn={drawn} className="map grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-center lg:gap-14">
      <svg
        viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
        role="img"
        aria-label="Map of the Great Lakes region. Highways fan out from the Windsor–Detroit crossing: Highway 401 east to London and Toronto, I-75 south to Toledo and north to Flint, I-94 west to Chicago, and I-96 to Grand Rapids."
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
          {order.map((key, i) => (
            <path key={`glow-${key}`} d={routes[key].d} pathLength={1} style={{ "--i": i } as React.CSSProperties} className="map-route stroke-fender opacity-70" strokeWidth="11" />
          ))}
          {order.map((key, i) => {
            const on = hotRoutes?.includes(key);
            return (
              <path
                key={key}
                d={routes[key].d}
                pathLength={1}
                style={{ "--i": i } as React.CSSProperties}
                className={`map-route ${on ? "stroke-amber" : "stroke-white"} ${hotRoutes && !on ? "opacity-25" : "opacity-100"}`}
                strokeWidth={on ? 5 : 3}
              />
            );
          })}
        </g>

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

        {hotRoutes?.map((key) => (
          <circle key={key} r="6" className="map-runner fill-amber">
            <animateMotion dur="2.6s" repeatCount="indefinite" path={routes[key].d} calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
          </circle>
        ))}

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
            <circle cx="872" cy="534" r="6" className="fill-white" />
            <circle cx="888" cy="628" r="6" className="fill-amber" />
            <text x="885" y="530" className="map-inset fill-white">Detroit</text>
            <text x="875" y="625" textAnchor="end" className="map-inset fill-white">Windsor</text>
          </g>
          <circle cx="880" cy="575" r="86" fill="none" strokeWidth="2" className="stroke-amber" />
        </g>

        <circle cx={cx} cy={cy} r="12" className="map-ping fill-none stroke-amber" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="9" className="fill-amber stroke-navy-deep" strokeWidth="3" />
        <text x={cx + 16} y={cy + 34} className="map-home fill-white">
          Windsor–Detroit
        </text>
      </svg>

      <div>
        <h3 className="font-semibold text-mist">Road distance from the crossing</h3>
        <ul className="mt-3 border-t border-white/15" onPointerLeave={() => setHot(null)}>
          {destinations.map((d, i) => (
            <li key={d.name} className="border-b border-white/15">
              <button
                type="button"
                aria-pressed={hot === i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHot(i)}
                onFocus={() => setHot(i)}
                onBlur={() => setHot(null)}
                onClick={() => setHot(hot === i ? null : i)}
                className="group flex w-full items-baseline justify-between gap-4 py-3 text-left"
              >
                <span>
                  <span className={`display text-2xl transition-colors duration-150 ${hot === i ? "text-amber" : "text-white"}`}>{d.name}</span>
                  <span className="ml-3 text-sm text-mist">{d.via}</span>
                </span>
                <span className="shrink-0 text-mist tabular-nums">about {d.km} km</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
