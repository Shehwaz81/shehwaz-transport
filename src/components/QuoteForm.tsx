"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestQuote, type QuoteState } from "@/app/actions";
import { company, services } from "@/lib/data";

const initial: QuoteState = { status: "idle" };

export function QuoteForm() {
  const [state, action, pending] = useActionState(requestQuote, initial);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Put the keyboard on the first field that needs fixing.
  useEffect(() => {
    if (state.status === "invalid")
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-plate border-[1.5px] border-chrome bg-white p-8">
        <p className="display text-4xl">Quote request sent.</p>
        <p className="mt-3 max-w-[44ch] text-steel">
          Dispatch will call or email you back. If the load is urgent, call{" "}
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
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label}
        {!props.required && <span className="font-normal text-steel"> (optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={v[name]}
        aria-invalid={e[name] ? true : undefined}
        aria-describedby={e[name] ? `${name}-error` : undefined}
        className="field"
        {...props}
      />
      {e[name] && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-[#b42318]">
          {e[name]}
        </p>
      )}
    </div>
  );

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      {field("pickup", "Pickup city", { required: true, placeholder: "Windsor, ON" })}
      {field("delivery", "Delivery city", { required: true, placeholder: "Detroit, MI" })}
      {field("date", "Pickup date", { type: "date" })}
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
      {field("name", "Your name", { required: true, autoComplete: "name" })}
      {field("company", "Company", { autoComplete: "organization" })}
      {field("email", "Email", { required: true, type: "email", autoComplete: "email" })}
      {field("phone", "Phone", { required: true, type: "tel", autoComplete: "tel" })}
      <div className="sm:col-span-2">
        <label htmlFor="details" className="mb-1.5 block text-sm font-semibold">
          What are we moving?
          <span className="font-normal text-steel"> (optional)</span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          defaultValue={v.details}
          placeholder="Number of skids, weight, anything dispatch should know"
          className="field resize-y"
        />
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
          {pending ? "Sending…" : "Send quote request"}
        </button>

        <div aria-live="polite">
          {state.status === "invalid" && (
            <p className="mt-3 text-sm text-[#b42318]">
              Some details are missing. Check the fields marked above.
            </p>
          )}
          {state.status === "fallback" && (
            <div className="mt-4 rounded-plate border-[1.5px] border-navy bg-white p-4">
              <p className="font-semibold">The website couldn&apos;t send your request.</p>
              <p className="mt-1 text-steel">
                Your details are still here. Send them from your own email, or call dispatch at{" "}
                <a href={company.phoneHref} className="font-semibold text-navy underline">
                  {company.phone}
                </a>
                .
              </p>
              <a href={state.mailto} className="btn btn-outline mt-3">
                Open in my email app
              </a>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
