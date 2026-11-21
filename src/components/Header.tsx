"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { company } from "@/lib/data";

const links = [
  { name: "Services", href: "/#services" },
  { name: "Cross-border", href: "/#border" },
  { name: "Fleet", href: "/#fleet" },
  { name: "Drivers", href: "/#drivers" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="on-navy fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-deep text-white">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo-mark.png"
            alt=""
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <span className="display text-[1.6rem] leading-none">{company.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-draw text-[0.95rem] font-medium text-mist transition-colors duration-150 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href={company.phoneHref}
            className="link-draw hidden items-center gap-2 font-semibold tabular-nums md:flex"
          >
            <span aria-hidden className="size-2 rounded-full bg-amber" />
            <span className="font-medium text-mist max-xl:sr-only">Dispatch 24/7</span>
            {company.phone}
          </a>
          <Link href="/#quote" className="btn btn-light hidden min-h-10! px-4! md:inline-flex">
            Get a quote
          </Link>
          <button
            type="button"
            className="-mr-2 grid size-11 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">Menu</span>
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>

      {/* dims the page under the open menu; a tap on it closes the menu */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-x-0 top-16 bottom-0 bg-navy-deep/80 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        id="mobile-nav"
        inert={!open}
        data-open={open}
        className="menu-panel absolute inset-x-0 top-full border-b border-white/10 bg-navy-deep lg:hidden"
      >
        <nav aria-label="Mobile" className="shell flex flex-col py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="display border-b border-white/10 py-4 text-3xl last:border-0"
            >
              {link.name}
            </Link>
          ))}
          <a
            href={company.phoneHref}
            className="mt-3 flex items-center gap-2 py-3 font-semibold tabular-nums md:hidden"
          >
            <Phone aria-hidden className="size-4" />
            Dispatch, 24/7: {company.phone}
          </a>
        </nav>
      </div>
    </header>
  );
}
