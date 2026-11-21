"use server";

import { company } from "@/lib/data";

export type QuoteState = {
  status: "idle" | "sent" | "invalid" | "fallback";
  errors?: Record<string, string>;
  values?: Record<string, string>;
  mailto?: string;
};

const fields = [
  "name",
  "company",
  "email",
  "phone",
  "pickup",
  "delivery",
  "date",
  "service",
  "details",
] as const;

const labels: Record<(typeof fields)[number], string> = {
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  pickup: "Pickup",
  delivery: "Delivery",
  date: "Pickup date",
  service: "Service",
  details: "Details",
};

export async function requestQuote(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  // Hidden field real people never fill in. Pretend it worked so bots move on.
  if (formData.get("website")) return { status: "sent" };

  const values = Object.fromEntries(
    fields.map((f) => [f, String(formData.get(f) ?? "").trim().slice(0, f === "details" ? 3000 : 200)]),
  ) as Record<(typeof fields)[number], string>;

  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Enter your name.";
  // Dispatch needs one way to reach the shipper; either is enough.
  const digits = values.phone.replace(/\D/g, "").length;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  if (!values.email && !values.phone) {
    errors.email = "Enter an email or a phone number so dispatch can reply.";
  } else {
    if (values.email && !emailOk) errors.email = "This email looks incomplete. Check it, or leave it blank and give a phone number.";
    if (values.phone && digits < 10) errors.phone = "Enter the full number with area code, 10 digits.";
  }
  if (values.date && values.date < new Date(Date.now() - 864e5).toISOString().slice(0, 10))
    errors.date = "This date has passed. Pick today or later.";
  if (!values.pickup) errors.pickup = "Enter the pickup city.";
  if (!values.delivery) errors.delivery = "Enter the delivery city.";
  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");
  const subject = `Quote request: ${oneLine(values.pickup)} to ${oneLine(values.delivery)}`;
  const text = fields
    .filter((f) => values[f])
    .map((f) => `${labels[f]}: ${values[f]}`)
    .join("\n");

  const fallback: QuoteState = {
    status: "fallback",
    values,
    mailto: `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  };

  const key = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!key || !from) return fallback;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: company.email,
        ...(values.email ? { reply_to: values.email } : {}),
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Quote email failed", res.status, await res.text());
      return fallback;
    }
    return { status: "sent" };
  } catch (err) {
    console.error("Quote email failed", err);
    return fallback;
  }
}
