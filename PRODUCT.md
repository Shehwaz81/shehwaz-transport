# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all of whom need to come away impressed:

- **Shippers needing a carrier**: logistics and shipping managers at manufacturers and distributors looking for a carrier to move their freight, especially across the Windsor–Detroit border.
- **Legitimacy checkers**: anyone who heard the name by phone, referral or a load board and looks the company up to confirm it is real, established and reachable.
- **Potential hires**: drivers (and possibly dispatch staff) sizing the company up as an employer.

## Product Purpose

The marketing site for Shehwaz Transport Inc., a Windsor, Ontario trucking company. It exists to turn shippers into quote requests or dispatch calls, to prove the company is credible to anyone checking it out, and to make the company look like a place worth driving for. Success means calls and quote requests from shippers, and a professional first impression for every audience.

## Positioning

Windsor–Detroit cross-border trucking. The company is based at the border, so cross-border lanes between Ontario and Michigan and on into the US are its specialty, not an add-on.

## Operating Context

- Shippers usually arrive needing a carrier for a specific load or lane and want to reach dispatch quickly by phone or email.
- Legitimacy checkers arrive from a search on the company name and scan for proof: real contact details, a real fleet, a real person behind it.
- The site is a Next.js app deployed at https://shehwaztransport.ca with a home page (hero, services, stats, about, contact) and one page per service at `/services/[slug]`.

## Capabilities and Constraints

- Services offered: FTL full truckload, LTL less than truckload, expedited freight, emergency shipping (rush, same-day, next-day). Dry van and intermodal, local and long haul, Canada and USA.
- Fleet: 4 trucks, dry van. Based in Windsor, ON.
- Dispatch is staffed 24/7, 365 days a year.
- Contact: phone +1 (416) 908-8377, email dispatch@shehwaztransport.ca, location Windsor, ON, Canada (no street address published). Canonical source: `src/lib/data.ts`.
- The quote form emails dispatch through Resend once `RESEND_API_KEY` and `QUOTE_FROM_EMAIL` are set (see README); until then it hands the request to the customer's own email app.
- Open: there is no careers or driver-recruitment page yet, though hires are a target audience. What a hiring path should say (pay, lanes, requirements) is undecided.

## Brand Commitments

- Name: Shehwaz Transport Inc. Small, family-owned operation.
- Tagline, from the business card: "Hauling Solutions You Can Trust".
- Truck livery: white cab, royal-blue fenders, chrome.
- Logo assets: `public/images/logo-full.png`, `public/images/logo.jpeg`, plus icons in `public/`.

## Evidence on Hand

- Confirmed claims the owner stands behind: 99% on-time delivery, 100% client satisfaction, 24/7 dispatch, 4-truck dry van fleet, Windsor-based.
- Real photography: trucks (`public/images/truck1.jpeg`, `truck2.jpeg`, `truck3.jpeg`) and `public/images/info.jpeg`. The owner's portrait was removed at the family's request; do not show him.
- No testimonials, named customers, case studies, certifications, or authority numbers (e.g. MC/DOT/CVOR) are on hand. Do not invent them.

## Product Principles

1. Lead with the border. Cross-border Windsor–Detroit capability is the reason to choose this carrier over another one.
2. Make dispatch easy to reach. The phone number and quote path should never be more than a glance away.
3. Prove it's real. Real trucks, a real founder and real contact details carry more weight than polished generic claims.
4. Be honest about size. A 4-truck family operation offers direct contact and accountability; don't dress it up as a mega-carrier.
5. Speak to drivers too. The site should read as a credible employer, not just a vendor.
