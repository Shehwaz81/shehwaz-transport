"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function About() {
  return (
    <section id="about" className="py-16 md:py-24 bg-navy-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 md:w-64 md:h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative h-[300px] md:h-[500px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="/images/pfp.jpeg"
                alt="Shehwaz Transport Founder"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
            </div>
            
            {/* Floating Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 bg-orange-500 text-white p-4 md:p-6 rounded-2xl shadow-xl hidden sm:block"
            >
              <p className="text-2xl md:text-3xl font-bold">100%</p>
              <p className="text-xs md:text-sm font-medium text-orange-100">Client Satisfaction</p>
            </motion.div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="space-y-6 md:space-y-8"
          >
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 mb-4">
                <span className="text-xs md:text-sm font-bold text-orange-500 tracking-wide uppercase">
                  The Shehwaz Standard
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Built on a Promise of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Excellence
                </span>
              </h2>
            </div>

            <div className="space-y-4 md:space-y-6 text-base md:text-lg text-gray-300 leading-relaxed">
              <p>
                Founded in Windsor, Shehwaz Transport Inc. was built on a simple promise: delivering excellence across borders. With a dedicated fleet of 4 trucks and a deep understanding of the North American supply chain, we provide the personalized service of a small family business with the reliability of a global carrier.
              </p>
              <p className="font-medium text-white">
                We don't just move freight; we move your business forward.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                "Family-Owned Values",
                "Cross-Border Experts",
                "24/7 Dispatch Team",
                "Modern Fleet"
              ].map((item, index) => (
                <motion.div 
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-gray-300 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
