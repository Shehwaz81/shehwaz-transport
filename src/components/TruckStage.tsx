"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { TruckScene } from "./truck/scene";

/*
 * A pinned 3D scene with the page's own content scrolling over it. The first
 * screen of `children` is the hero; each screen after it is one chapter, and
 * the scroll position between them drives the truck.
 */
export function TruckStage({ chapters, children }: { chapters: string[]; children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const screens = chapters.length + 1;

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    let scene: TruckScene | null = null;
    let dead = false;

    const read = () => {
      const r = section.getBoundingClientRect();
      const c = Math.min(screens - 1, Math.max(0, -r.top / (r.height / screens)));
      scene?.setChapter(c);
      setActive(Math.round(c));
    };

    const io = new IntersectionObserver(([entry]) => scene?.setActive(entry.isIntersecting));
    io.observe(section);
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);

    (async () => {
      try {
        const { createTruckScene } = await import("./truck/scene");
        await document.fonts.ready;
        if (dead) return;
        scene = createTruckScene(canvas, {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          logoUrl: "/images/logo-mark.png",
          fontFamily: getComputedStyle(document.body).fontFamily,
          onFirstFrame: () => setReady(true),
        });
        read();
      } catch {
        // No WebGL: the photograph stands in for the model.
        setFailed(true);
      }
    })();

    return () => {
      dead = true;
      io.disconnect();
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      scene?.dispose();
    };
  }, [screens]);

  const jump = (i: number) => {
    const section = sectionRef.current!;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (section.offsetHeight / screens) * (i + 1) });
  };

  return (
    <section ref={sectionRef} className="on-navy relative bg-navy-deep text-white">
      <div className="sticky top-0 h-svh overflow-hidden">
        {failed ? (
          <Image src="/images/truck2.jpeg" alt="" fill sizes="100vw" className="object-cover opacity-35" />
        ) : (
          <canvas
            ref={canvasRef}
            aria-hidden
            className={`absolute inset-0 size-full transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {/* keeps type readable where it sits over the scene */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-deep/90 via-navy-deep/25 to-transparent md:bg-gradient-to-r md:from-navy-deep/80 md:via-navy-deep/20" />

        <nav
          aria-label="Services shown in the scene"
          className={`shell absolute inset-x-0 bottom-24 transition-opacity duration-200 md:bottom-10 ${active > 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <ol className="grid grid-cols-4 gap-2 sm:gap-4">
            {chapters.map((title, i) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={active === i + 1 ? "step" : undefined}
                  tabIndex={active > 0 ? 0 : -1}
                  className="group block w-full py-2 text-left"
                >
                  <span className="relative block h-0.5 overflow-hidden bg-white/20">
                    <span
                      className={`absolute inset-0 origin-left bg-white transition-transform duration-300 ease-out-strong ${active >= i + 1 ? "scale-x-100" : "scale-x-0"}`}
                    />
                  </span>
                  <span
                    className={`mt-2 hidden text-sm font-medium transition-colors duration-150 sm:block ${active === i + 1 ? "text-white" : "text-mist group-hover:text-white"}`}
                  >
                    {title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="relative -mt-[100svh]">{children}</div>
    </section>
  );
}
