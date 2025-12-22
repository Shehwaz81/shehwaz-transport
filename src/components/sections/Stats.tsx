"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ShieldCheck, TrendingUp } from "lucide-react";

const stats = [
	{
		id: 1,
		label: "On-Time Delivery",
		value: "99%",
		icon: Clock,
		description: "Precision scheduling you can count on.",
	},
	{
		id: 2,
		label: "Dispatch Support",
		value: "24/7",
		icon: ShieldCheck,
		description: "Always available, day or night.",
	},
	{
		id: 3,
		label: "Coverage",
		value: "North America",
		icon: MapPin,
		description: "Cross-border logistics expertise.",
	},
	{
		id: 4,
		label: "Client Satisfaction",
		value: "100%",
		icon: TrendingUp,
		description: "Dedicated to exceeding expectations.",
	},
];

export function Stats() {
	return (
		<section className="py-16 md:py-24 bg-navy-900 relative overflow-hidden">
			{/* Background Elements */}
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

			<div className="container mx-auto px-4 md:px-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
					{stats.map((stat, index) => (
						<motion.div
							key={stat.id}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ delay: index * 0.1, duration: 0.5 }}
							className="relative group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-colors"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

							<div className="relative z-10">
								<div className="w-12 h-12 rounded-lg bg-navy-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
									<stat.icon className="w-6 h-6 text-orange-500" />
								</div>

								<h3 className="text-4xl font-bold text-white mb-2">
									{stat.value}
								</h3>
								<p className="text-lg font-semibold text-gray-200 mb-2">
									{stat.label}
								</p>
								<p className="text-sm text-gray-400">
									{stat.description}
								</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
