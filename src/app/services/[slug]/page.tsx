import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { company, services } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.id === slug);
  if (!service) return {};
  const name = service.abbr ? `${service.title} (${service.abbr})` : service.title;
  return {
    title: `${name} | ${company.legalName}`,
    description: `${service.summary} Cross-border trucking from Windsor, Ontario with 24/7 dispatch.`,
    alternates: { canonical: `/services/${service.id}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.id === slug);
  if (!service) notFound();

  return (
    <>
      <section className="shell pt-28 sm:pt-32">
        <nav aria-label="Breadcrumb" className="rise text-steel">
          <Link href="/#services" className="underline underline-offset-4 hover:text-navy">
            Services
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span>{service.title}</span>
        </nav>
        <h1 className="display rise mt-5 text-[clamp(3.1rem,10.5vw,7.75rem)] [--i:1]">
          {service.title}
        </h1>
        <p className="rise mt-6 max-w-[46ch] text-xl leading-relaxed text-steel [--i:2] sm:text-2xl">
          {service.summary}
        </p>
        <div className="unveil relative mt-10 aspect-[4/3] overflow-hidden rounded-plate sm:aspect-[5/2]">
          <Image
            src={service.image}
            alt="A Shehwaz Transport truck: white Freightliner cab with royal-blue fenders and a dry van trailer."
            fill
            priority
            sizes="(min-width: 76rem) 72rem, 100vw"
            className="object-cover object-[50%_58%]"
          />
        </div>
      </section>

      <section className="shell grid gap-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-20">
        <div>
          <div className="max-w-[62ch] space-y-6 text-lg leading-relaxed">
            {service.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl className="mt-10 max-w-[62ch] border-t-2 border-navy pt-6">
            <dt className="font-semibold">Best for</dt>
            <dd className="mt-1 text-lg text-steel">{service.bestFor}</dd>
          </dl>
        </div>

        <aside className="on-navy self-start rounded-plate bg-navy p-7 text-white sm:p-9">
          <h2 className="display text-4xl">Price this load</h2>
          <p className="mt-3 text-mist">
            Send the pickup, the delivery and the date, or call dispatch at any hour.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/#quote" className="btn btn-light">
              Get a quote
            </Link>
            <a href={company.phoneHref} className="btn btn-ghost-light tabular-nums">
              <Phone aria-hidden className="size-4" />
              {company.phone}
            </a>
          </div>
        </aside>
      </section>

      <section className="shell pb-20 sm:pb-28">
        <h2 className="display text-4xl sm:text-5xl">Other services</h2>
        <ul className="mt-6 border-t-2 border-navy">
          {services
            .filter((s) => s.id !== service.id)
            .map((s) => (
              <li key={s.id} className="border-b border-chrome">
                <Link
                  href={`/services/${s.id}`}
                  className="group grid gap-x-8 gap-y-1 py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] md:items-baseline"
                >
                  <span className="display text-3xl transition-colors duration-150 group-hover:text-fender">
                    {s.title}
                  </span>
                  <span className="text-steel">{s.summary}</span>
                  <ArrowRight
                    aria-hidden
                    className="arrow hidden size-5 self-center text-steel group-hover:text-fender md:block"
                  />
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}
