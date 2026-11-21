import Image from "next/image";
import Link from "next/link";
import { company, services } from "@/lib/data";

export function Footer() {
  return (
    <footer className="on-navy bg-navy-deep pb-28 text-white md:pb-0">
      <div className="shell py-16 md:py-20">
        <div className="flex items-end justify-between gap-8">
          <p className="display max-w-[9em] text-5xl sm:text-6xl md:text-7xl">{company.tagline}</p>
          <Image
            src="/images/logo-mark.png"
            alt={`${company.legalName} logo`}
            width={128}
            height={128}
            className="hidden rounded-full sm:block"
          />
        </div>

        <div className="mt-14 grid gap-10 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-semibold">{company.legalName}</p>
            <p className="mt-1 text-mist">{company.city}, Canada</p>
            {company.authority.length > 0 && (
              <p className="mt-3 text-mist tabular-nums">
                {company.authority.map((a) => `${a.label} ${a.number}`).join(", ")}
              </p>
            )}
          </div>

          <div>
            <p className="font-semibold">Dispatch, 24/7</p>
            <ul className="mt-2 space-y-1 text-mist">
              <li>
                <a href={company.phoneHref} className="link-draw tabular-nums hover:text-white">
                  {company.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${company.email}`} className="link-draw break-all hover:text-white">
                  {company.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">Services</p>
            <ul className="mt-2 space-y-1 text-mist">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.id}`} className="link-draw hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 text-sm text-mist">
          &copy; {new Date().getFullYear()} {company.legalName}
        </p>
      </div>
    </footer>
  );
}
