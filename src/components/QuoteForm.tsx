"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestQuote, type QuoteState } from "@/app/actions";
import { company, places, services } from "@/lib/data";

const initial: QuoteState = { status: "idle" };
const today = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd in local time

export function QuoteForm() {
  const [state, action, pending] = useActionState(requestQuote, initial);
  const v = state.values ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // An error disappears as soon as its field is edited; a new response brings a fresh set.
  const [edited, setEdited] = useState<{ since: QuoteState; names: Set<string> }>({ since: state, names: new Set() });
  const editedNames = edited.since === state ? edited.names : new Set<string>();
  const e = Object.fromEntries(Object.entries(state.errors ?? {}).filter(([name]) => !editedNames.has(name)));
  const stale = editedNames.size > 0;

  // Put the keyboard on the first field that needs fixing.
  useEffect(() => {
    if (state.status === "invalid")
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // The map hands over a destination: fill it in and start at the pickup.
  useEffect(() => {
    const onLane = (ev: Event) => {
      const form = formRef.current;
      if (!form) return;
      (form.elements.namedItem("delivery") as HTMLInputElement).value = (ev as CustomEvent<string>).detail;
      // The link's own jump to the form takes focus after this runs, so the pickup field is focused a
      // moment later. Not on touch screens: there it would raise the keyboard over a page still scrolling.
      if (window.matchMedia("(pointer: fine)").matches)
        setTimeout(() => (form.elements.namedItem("pickup") as HTMLInputElement).focus({ preventScroll: true }), 0);
    };
    window.addEventListener("quote-lane", onLane);
    return () => window.removeEventListener("quote-lane", onLane);
  }, []);

  if (state.status === "sent") {
    return (
      <div role="status" className="appear rounded-plate border-[1.5px] border-rule bg-white p-8">
        <p className="display text-4xl">Quote request sent.</p>
        <p className="mt-3 max-w-[44ch] text-steel">
          Dispatch will call or email you back. To talk it through sooner, call{" "}
          <a href={company.phoneHref} className="font-semibold text-navy underline">
            {company.phone}
          </a>{" "}
          now.
        </p>
      </div>
    );
  }

  const field = (
    name: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & { optional?: boolean } = {},
  ) => {
    const { optional, ...input } = props;
    return (
      <div>
        <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
          {label}
          {optional && <span className="font-normal text-steel"> (optional)</span>}
        </label>
        <input
          id={name}
          name={name}
          defaultValue={v[name]}
          aria-invalid={e[name] ? true : undefined}
          aria-describedby={e[name] ? `${name}-error` : undefined}
          className="field"
          {...input}
        />
        {e[name] && (
          <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">
            {e[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      onInput={(ev) => {
        const name = (ev.target as HTMLInputElement).name;
        if (name && !editedNames.has(name)) setEdited({ since: state, names: new Set(editedNames).add(name) });
      }}
      className="grid gap-10"
    >
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="display mb-5 text-2xl">The load</legend>
        {field("pickup", "Pickup city", { required: true, placeholder: "Windsor, ON", list: "places" })}
        {field("delivery", "Delivery city", { required: true, placeholder: "Detroit, MI", list: "places" })}
        <datalist id="places">
          {places.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        {field("date", "Pickup date", { type: "date", min: today(), optional: true })}
        <div>
          <label htmlFor="service" className="mb-1.5 block text-sm font-semibold">
            Service
          </label>
          <select id="service" name="service" defaultValue={v.service ?? "Not sure yet"} className="field">
            <option>Not sure yet</option>
            {services.map((s) => (
              <option key={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="details" className="mb-1.5 block text-sm font-semibold">
            What are we moving?
            <span className="font-normal text-steel"> (optional)</span>
          </label>
          <textarea
            id="details"
            name="details"
            rows={3}
            defaultValue={v.details}
            placeholder="Number of skids, weight, anything dispatch should know"
            className="field resize-y"
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="display mb-5 text-2xl">How to reach you</legend>
        {field("name", "Your name", { required: true, autoComplete: "name" })}
        {field("company", "Company", { autoComplete: "organization", optional: true })}
        {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
        <p className="text-sm text-steel sm:col-span-2">Email or phone, whichever you prefer. One is enough.</p>
      </fieldset>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        {state.status === "fallback" && !stale ? (
          // No mail service behind the form: the request goes out from the shipper's own email instead.
          <div role="status" className="appear rounded-plate border-[1.5px] border-navy bg-white p-5 sm:p-6">
            <p className="display text-3xl">One more step: send it from your email.</p>
            <p className="mt-2 max-w-[52ch] text-steel">
              Your request is written out and addressed to dispatch. Open it in your email app and press send, or
              call{" "}
              <a href={company.phoneHref} className="font-semibold text-navy underline">
                {company.phone}
              </a>{" "}
              and read it to us.
            </p>
            <a href={state.mailto} className="btn btn-primary mt-4 w-full sm:w-auto">
              Open my email with the request
            </a>
          </div>
        ) : (
          <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
            {pending ? "Sending…" : "Send quote request"}
          </button>
        )}

        <p aria-live="polite" className="mt-3 text-sm text-danger empty:hidden">
          {state.status === "invalid" && Object.keys(e).length > 0 && "Some details need another look. Check the fields marked above."}
        </p>
      </div>
    </form>
  );
}
