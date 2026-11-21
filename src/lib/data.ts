export const company = {
  name: "Shehwaz Transport",
  legalName: "Shehwaz Transport Inc.",
  tagline: "Hauling solutions you can trust.",
  phone: "(416) 908-8377",
  phoneHref: "tel:+14169088377",
  email: "dispatch@shehwaztransport.ca",
  city: "Windsor, ON",
  // Operating authority as lettered on the truck doors, e.g.
  // { label: "US DOT", number: "0000000" }. Entries show on the door decal
  // and in the footer. Left empty until the numbers are confirmed.
  authority: [] as { label: string; number: string }[],
};

export const facts = [
  { value: "99%", label: "on-time delivery" },
  { value: "24/7", label: "dispatch, 365 days a year" },
  { value: "4", label: "trucks, running dry van" },
  { value: "100%", label: "client satisfaction" },
];

export const services = [
  {
    id: "ftl-full-truckload",
    title: "Full truckload",
    abbr: "FTL",
    summary:
      "Your freight gets the whole trailer and goes straight from pickup to delivery.",
    bestFor: "Full trailers, dedicated runs and freight that shouldn't be handled twice.",
    image: "/images/truck2.jpeg",
    body: [
      "A full truckload means one shipper, one trailer and one trip. We load at your dock and drive the freight to the consignee without moving it through a warehouse on the way.",
      "We haul dry van and intermodal freight, local and long haul, across Canada and the United States. The Windsor–Detroit crossing is the lane we know best.",
      "Dispatch is staffed 24 hours a day, 365 days a year, so there is always someone to call about where your load is.",
    ],
  },
  {
    id: "ltl-less-than-truckload",
    title: "Less than truckload",
    abbr: "LTL",
    summary: "Ship a few skids without paying for the whole trailer.",
    bestFor: "A few skids at a time and regular smaller orders.",
    image: "/images/truck3.jpeg",
    body: [
      "LTL is for freight that doesn't fill a trailer. You pay for the space you use, which makes smaller and more frequent shipments affordable.",
      "We pick up and deliver your skids without transferring them through a warehouse, so the freight is handled less and arrives sooner.",
      "If a partial load can't share a trailer, we can put it on a dedicated truck.",
    ],
  },
];

// The lanes on the map, as the quote form offers them. Any other city can still be typed in.
export const places = [
  "Windsor, ON",
  "Detroit, MI",
  "London, ON",
  "Toronto, ON",
  "Buffalo, NY",
  "Toledo, OH",
  "Cleveland, OH",
  "Grand Rapids, MI",
  "Chicago, IL",
];
