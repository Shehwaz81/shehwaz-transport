import { Truck, Clock, Warehouse, Package, Zap, MapPin } from "lucide-react";

export const contactInfo = {
  email: "dispatch@shehwaztransport.ca",
  phone: "+1 (416) 908-8377", // Placeholder, user didn't provide phone
  address: "Windsor, ON, Canada", // Placeholder
};

export const services = [
  {
    id: "ftl-full-truckload",
    title: "FTL Full Truckload",
    shortDescription: "Reliable coast-to-coast shipping for your most critical freight with our dedicated fleet.",
    fullDescription: `
      <p>Shehwaz Transport Inc. provides a full service of dry van, intermodal local and long haul Canada and USA. We have a dedicated fleet of trucks. This will allow your company to focus on your strengths and not have to worry about the end or the delivery.</p>
      
      <p>With its large fleet of vehicles and extensive road transport network throughout Canada and North America, Shehwaz Transport satisfies the transport needs of its clients thanks to its long experience with Full Truck Loads.</p>
      
      <p>Whether it’s road or combined transport, we plan optimal transport solutions for our clients, based on their specific needs. In choosing Shehwaz Transport as their transportation partner, clients can trust a top-level service to match their requirements while helping to safeguard the environment.</p>
      
      <p>We are always attentive to the environmental impact of our transport services. This is proved by the renewal of our fleet of vehicles that constantly meet the latest Safety standards. Our team of experienced, professional drivers attend refresher courses to maintain their driving skills at peak level.</p>
      
      <p>Shehwaz Transport works 365 days a year, 24/7, to ensure the traceability of your goods, offering guaranteed services backed up by a team of experts.</p>
    `,
    icon: Truck,
    image: "/images/truck2.jpeg",
    className: "md:col-span-2",
  },
  {
    id: "ltl-less-than-truckload",
    title: "LTL Less Than Truckload",
    shortDescription: "Cost-effective solutions for smaller shipments without compromising on speed or safety.",
    fullDescription: `
      <p>This service is the answer to those companies who want to reduce the average amount of goods shipped and therefore to make more frequent shipments.</p>
      
      <p>Shehwaz Transport picks up and delivers your lots without transfers to the warehouse, ensuring the safety of the goods and reducing the delivery time.</p>
      
      <p>For the shipment of lots you also have the possibility of express delivery with dedicated vehicles. We optimize routes to ensure your partial loads get the same priority treatment as full truckloads.</p>
    `,
    icon: Package,
    image: "/images/truck1.jpeg",
    className: "md:col-span-1",
  },
  {
    id: "expedited-freight",
    title: "Expedited Freight",
    shortDescription: "Time-critical shipping with regular updates and detailed confirmations.",
    fullDescription: `
      <p>Communication is what really allows us to stand out. We strive to impress with regular and accurate updates and detailed confirmations when loaded and proof of delivery as soon as possible. Through our close monitoring system, we will advise of any adjustment to the initial estimated time of arrival.</p>
      
      <p>When your cargo is time critical, you can trust Shehwaz Transport Expedite service to deliver on time and on budget.</p>
      
      <p>With vehicles daily, we’re extremely resourceful in making things happen and always have a can-do, pro-active approach.</p>
    `,
    icon: Zap,
    image: "/images/truck3.jpeg",
    className: "md:col-span-1",
  },
  {
    id: "emergency-shipping",
    title: "Emergency Shipping",
    shortDescription: "Rush delivery, same day, and next day services for urgent logistics needs.",
    fullDescription: `
      <p>Shehwaz Transport provides a full service of dry van, intermodal local and long haul Canada and USA. We serve our customers with rush delivery service, same day delivery service, next day delivery service, delivery vacation service, and dedicated fleet service.</p>
      
      <p>When every minute counts, our emergency shipping team mobilizes instantly to get your freight moving. We understand that supply chain disruptions can be costly, which is why we offer rapid response solutions.</p>
    `,
    icon: Clock,
    image: "/images/info.jpeg",
    className: "md:col-span-2",
  },
  {
    id: "warehouse-distribution",
    title: "Warehouse & Distribution",
    shortDescription: "Secure storage and efficient distribution solutions to streamline your supply chain.",
    fullDescription: `
      <p>Need warehousing with your transportation? Shehwaz Transport can help your company with more than just commercial freight delivery. We save you money and get products to their customers faster and cheaper by storing it in our warehouse.</p>
      
      <p>Our warehousing solutions are flexible and scalable, allowing you to manage inventory fluctuations with ease. Combined with our distribution network, we offer a seamless end-to-end logistics experience.</p>
    `,
    icon: Warehouse,
    image: "/images/truck2.jpeg", // Reusing image for now
    className: "md:col-span-1",
  },
];
