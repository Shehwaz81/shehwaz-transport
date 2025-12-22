"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/truck1.jpeg"
          alt="Shehwaz Transport Truck on the road"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-navy-900/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-4">
            <span className="text-sm font-medium text-orange-400 tracking-wide uppercase">
              Premier Logistics Partner
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Precision Logistics for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              North America
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            Delivering excellence across miles. We provide reliable, scalable, and professional trucking solutions tailored to your business needs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
            <Link
              href="/#contact"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Shipping
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/#services"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-lg transition-all"
            >
              Our Services
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent" />
      </motion.div>
    </section>
  );
}
