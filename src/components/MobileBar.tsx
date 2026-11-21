"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { company } from "@/lib/data";

/* Dispatchers and drivers are on phones; the call button stays under the thumb.
   It steps aside while the quote form is on screen so it never covers the fields. */
export function MobileBar() {
  const pathname = usePathname();
  const [away, setAway] = useState(false);

  useEffect(() => {
    const form = document.getElementById("quote");
    if (!form) return;
    const io = new IntersectionObserver(([entry]) => setAway(entry.isIntersecting), { rootMargin: "-45% 0px -45% 0px" });
    io.observe(form);
    return () => {
      io.disconnect();
      setAway(false);
    };
  }, [pathname]);

  return (
    <div
      inert={away}
      className={`on-navy fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-3 border-t border-white/10 bg-navy-deep px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out-strong md:hidden ${away ? "translate-y-full" : ""}`}
    >
      <a href={company.phoneHref} className="btn btn-ghost-light">
        <Phone aria-hidden className="size-4" />
        Call dispatch
      </a>
      <Link href="/#quote" className="btn btn-light">
        Get a quote
      </Link>
    </div>
  );
}
