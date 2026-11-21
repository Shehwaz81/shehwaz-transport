import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { CorridorMap } from "@/components/CorridorMap";
import { DoorDecal } from "@/components/DoorDecal";
import { QuoteForm } from "@/components/QuoteForm";
import { TruckStage } from "@/components/TruckStage";
import { company, facts, services } from "@/lib/data";

const [ftl, ltl, expedited, emergency] = services;
const bestFor = (text: string) => `Best for: ${text.replace(/\.$/, "").toLowerCase()}.`;

// One screen of the pinned truck scene each; the scene's own chapters are in truck/scene.ts.
const chapters = [
  {
    rail: "Full truckload",
    title: ftl.title,
    summary: ftl.summary,
    note: bestFor(ftl.bestFor),
    links: [{ href: `/services/${ftl.id}`, label: "See full truckload" }],
  },
  {
    rail: "Less than truckload",
    title: ltl.title,
    summary: ltl.summary,
    note: bestFor(ltl.bestFor),
    links: [{ href: `/services/${ltl.id}`, label: "See less than truckload" }],
  },
  {
    rail: "Expedited",
    title: "Expedited and emergency",
    summary: "Time-critical loads and same-day runs, with an update at every step.",
    note: "Best for: production parts, line-down situations and hard deadlines.",
    links: [
      { href: `/services/${expedited.id}`, label: "See expedited freight" },
      { href: `/services/${emergency.id}`, label: "See emergency shipping" },
    ],
  },
  {
    rail: "Cross-border",
    title: "Across the border",
    summary: "Windsor to Detroit is the lane we know best, in both directions.",
    note: "From there, on to Ontario, Michigan and the rest of Canada and the US.",
    links: [{ href: "/#border", label: "See where the crossing leads" }],
  },
];

export default function Home() {
  return (
    <>
      <TruckStage chapters={chapters.map((c) => c.rail)}>
        <div className="shell flex h-svh flex-col pt-24 sm:pt-32">
          <h1 className="display text-[clamp(2.9rem,7.4vw,6.5rem)]">
            {["Cross-border freight,", "Windsor to Detroit", "and back."].map((line, i) => (
              <span key={line} className="line-mask" style={{ "--i": i } as React.CSSProperties}>
                <span>{line} </span>
              </span>
            ))}
          </h1>
          <p className="rise mt-6 max-w-[44ch] text-lg leading-relaxed text-mist [--i:4] sm:text-xl">
            {company.name} is a family-owned carrier based in Windsor, Ontario. Four trucks hauling
            dry van freight between Canada and the United States, with dispatch on the phone 24/7.
          </p>
          <div className="rise mt-8 hidden gap-3 [--i:5] md:flex">
            <Link href="/#quote" className="btn btn-light">
              Get a quote
            </Link>
            <a href={company.phoneHref} className="btn btn-ghost-light tabular-nums">
              <Phone aria-hidden className="size-4" />
              Call dispatch {company.phone}
            </a>
          </div>
        </div>

        <h2 className="sr-only">What we haul</h2>
        {chapters.map((chapter, i) => (
          <article
            key={chapter.title}
            id={i === 0 ? "services" : undefined}
            className="shell flex h-svh scroll-mt-0 flex-col pt-24 md:justify-center md:pt-0 md:pb-[18svh]"
          >
            <div className="max-w-md">
              <h3 className="display text-5xl sm:text-7xl">{chapter.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-white sm:mt-5 sm:text-xl">{chapter.summary}</p>
              <p className="mt-3 text-mist max-sm:hidden">{chapter.note}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {chapter.links.map((link) => (
                  <Link key={link.href} href={link.href} className="btn btn-ghost-light group">
                    {link.label}
                    <ArrowRight aria-hidden className="arrow size-4" />
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </TruckStage>

      <section id="border" className="on-navy bg-navy-deep text-white">
        <div className="shell py-20 sm:py-28">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="display max-w-[12em] text-5xl sm:text-7xl">
              Based at the busiest crossing on the Canada&ndash;US border.
            </h2>
            <p className="max-w-[42ch] text-lg leading-relaxed text-mist">
              More trade crosses between Windsor and Detroit than anywhere else on the border. Our
              trucks are parked beside it, where Highway 401 meets I-75, I-94 and I-96.
            </p>
          </div>
          <div className="mt-12">
            <CorridorMap />
          </div>
        </div>
      </section>

      <section id="fleet" className="shell py-20 sm:py-28">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="display text-5xl sm:text-7xl">And this is the real one.</h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-steel">
            The model above is a drawing. These are photographs of unit 878 and trailer 8007: white
            cab, blue fenders, our name on the door. It&apos;s the truck that shows up at your dock.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:grid-rows-2 sm:gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-plate sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[30rem]">
            <Image
              src="/images/truck1.jpeg"
              alt="A Shehwaz Transport truck parked on a city street: white Freightliner cab with royal-blue fenders and a chrome grille, pulling a dry van trailer."
              fill
              sizes="(min-width: 40rem) 66vw, 100vw"
              className="object-cover object-[40%_60%]"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-plate">
            <Image
              src="/images/truck2.jpeg"
              alt="Unit 878 seen from the passenger side with its white dry van trailer, number 8007."
              fill
              sizes="(min-width: 40rem) 33vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-plate">
            <Image
              src="/images/truck3.jpeg"
              alt="The same truck from the driver's side, showing the Shehwaz Transport name on the door."
              fill
              sizes="(min-width: 40rem) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="shell grid gap-14 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="display text-5xl sm:text-7xl">A family company with four trucks.</h2>
            <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-steel">
              {company.legalName} was founded in Windsor and is still run by the family that started
              it. Being small means you deal with the same people on every load, and they&apos;re the
              ones accountable for it.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t-2 border-navy pt-8">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col-reverse">
                  <dt className="mt-2 text-steel">{fact.label}</dt>
                  <dd className="display text-5xl tabular-nums sm:text-6xl">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="drivers" className="lg:pt-3">
            <DoorDecal className="text-lg sm:text-xl" />
            <h2 className="display mt-10 text-4xl sm:text-5xl">Drive with us</h2>
            <p className="mt-4 max-w-[50ch] text-lg leading-relaxed text-steel">
              In a fleet this size, drivers are known by name. If you hold an AZ licence and want
              cross-border work out of Windsor, call or email and ask what&apos;s open.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={company.phoneHref} className="btn btn-outline tabular-nums">
                <Phone aria-hidden className="size-4" />
                Call {company.phone}
              </a>
              <a href={`mailto:${company.email}?subject=${encodeURIComponent("Driving for Shehwaz Transport")}`} className="btn btn-outline">
                <Mail aria-hidden className="size-4" />
                Email about driving
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="quote" className="shell grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
        <div>
          <h2 className="display text-5xl sm:text-7xl">Get a quote</h2>
          <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-steel">
            Tell us what&apos;s moving and where. Or skip the form and call: dispatch answers 24 hours
            a day, every day of the year.
          </p>
          <ul className="mt-8 space-y-4 text-lg">
            <li>
              <a href={company.phoneHref} className="link-draw inline-flex items-center gap-3 font-semibold tabular-nums">
                <Phone aria-hidden className="size-5 text-fender" />
                {company.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${company.email}`} className="link-draw inline-flex items-center gap-3 font-semibold break-all">
                <Mail aria-hidden className="size-5 shrink-0 text-fender" />
                {company.email}
              </a>
            </li>
          </ul>
        </div>
        <QuoteForm />
      </section>
    </>
  );
}
