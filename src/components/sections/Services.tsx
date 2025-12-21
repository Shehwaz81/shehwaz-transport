"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Long-Haul Transport",
    description: "Reliable coast-to-coast shipping for your most critical freight. We ensure your cargo reaches its destination safely and on schedule.",
    image: "/images/truck2.jpeg",
    className: "md:col-span-2",
  },
  {
    title: "Expedited Shipping",
    description: "Time-sensitive deliveries that can't wait. Our expedited services guarantee the fastest transit times possible.",
    image: "/images/truck3.jpeg",
    className: "md:col-span-1",
  },
  {
    title: "Temperature Controlled",
    description: "State-of-the-art reefer units to keep your perishable goods at the perfect temperature throughout the journey.",
    image: "/images/info.jpeg", // Using info.jpeg as a placeholder for reefer/specialized
    className: "md:col-span-1",
  },
  {
    title: "Dedicated Logistics",
    description: "Customized fleet solutions acting as an extension of your business. We handle the logistics so you can focus on growth.",
    image: "/images/truck1.jpeg", // Reusing truck1 for variety
    className: "md:col-span-2",
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-charcoal-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Our Services
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Comprehensive logistics solutions designed for efficiency, reliability, and scale.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative group overflow-hidden rounded-3xl bg-navy-800 border border-white/5",
                service.className
              )}
            >
              {/* Background Image */}
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
