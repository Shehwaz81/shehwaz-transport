import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { CorridorMap } from "@/components/CorridorMap";
import { DoorDecal } from "@/components/DoorDecal";
import { QuoteForm } from "@/components/QuoteForm";
import { TruckStage } from "@/components/TruckStage";
import { company, facts, services } from "@/lib/data";

export default function Home() {
  return (
    <>
      <TruckStage chapters={services.map((s) => s.title)}>
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

        <h2 id="services" className="sr-only">
          What we haul
        </h2>
        {services.map((service) => (
          <article key={service.id} className="shell flex h-svh flex-col pt-24 md:justify-center md:pt-0 md:pb-[18svh]">
            <div className="max-w-md">
              <h3 className="display text-5xl sm:text-7xl">{service.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-white sm:mt-5 sm:text-xl">{service.summary}</p>
              <p className="mt-3 text-mist max-sm:hidden">Best for: {service.bestFor.replace(/\.$/, "").toLowerCase()}.</p>
              <Link href={`/services/${service.id}`} className="btn btn-ghost-light group mt-6">
                See {service.title.toLowerCase()}
                <ArrowRight aria-hidden className="arrow size-4" />
              </Link>
            </div>
          </article>
        ))}
      </TruckStage>

      <section id="border" className="on-navy bg-navy-deep text-white">
        <div className="shell py-20 sm:py-28">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="display max-w-[12em] text-5xl sm:text-7xl">
              Based at the busiest border crossing in North America.
            </h2>
            <p className="max-w-[42ch] text-lg leading-relaxed text-mist">
              More trade crosses between Windsor and Detroit than anywhere else on the Canada&ndash;US
              border. Our trucks are parked beside it, where Highway 401 ends and I-75, I-94 and
              I-96 begin.
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
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="display block text-5xl tabular-nums sm:text-6xl">{fact.value}</span>
                    <span className="mt-2 block text-steel">{fact.label}</span>
                  </dd>
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
