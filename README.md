# Shehwaz Transport website

Marketing site for Shehwaz Transport Inc. (Next.js, Tailwind). Company facts, service copy and
the numbers shown on the door decal all live in `src/lib/data.ts`.

## The 3D truck and the map

The home page opens on a scroll-driven 3D scene built with three.js, in `src/components/truck/`:

- `model.ts` is the truck: unit 878 (a Freightliner Coronado) and trailer 8007, modelled in code
  from the photographs in the fleet section. Colours, lettering and freight are all here.
- `world.ts` is what surrounds it: the night lighting, the wet road and its reflections, the town
  lights, and the lens glow. It also picks cheaper settings for phones.
- `scene.ts` is the camera positions and what each scroll chapter shows.
- `kit.ts` is the small set of modelling helpers the other files share.

`src/components/TruckStage.tsx` ties the scene to the scroll position. It loads after the page's
text, shows one still per chapter for visitors who ask for reduced motion, and falls back to a
photograph where WebGL is missing.

The map's coastlines come from Natural Earth (public domain) and are stored as SVG paths in
`src/lib/mapData.ts`. Cities, distances and labels are in `src/components/CorridorMap.tsx`.

## Quote form email

The quote form sends email through [Resend](https://resend.com). Set two environment variables
where the site is hosted:

- `RESEND_API_KEY`: an API key from your Resend account.
- `QUOTE_FROM_EMAIL`: the sender, on a domain verified in Resend, e.g.
  `Shehwaz Transport website <quotes@shehwaztransport.ca>`.

Requests go to the dispatch address in `src/lib/data.ts`, with the customer as reply-to. Until
both variables are set, or if sending fails, the form shows the customer a button that opens the
same request in their own email app, plus the dispatch phone number.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
