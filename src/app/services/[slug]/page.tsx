import { services } from "@/lib/data";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";

// Generate static params for all services
export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.id,
  }));
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const service = services.find((s) => s.id === slug);

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-navy-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-navy-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {service.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            {service.shortDescription}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div 
                className="prose prose-lg prose-invert max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: service.fullDescription }}
              />
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-12">
                <h3 className="text-2xl font-bold text-white mb-6">Why Choose Shehwaz for {service.title}?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Real-time Tracking",
                    "Dedicated Support Team",
                    "Cost-Effective Solutions",
                    "Safety First Approach",
                    "On-Time Performance",
                    "Customized Logistics"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-orange-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Ship?</h3>
                <p className="mb-6 text-orange-100">
                  Get a competitive quote for your {service.title.toLowerCase()} needs today.
                </p>
                <Link
                  href="/#contact"
                  className="block w-full bg-white text-orange-600 text-center py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Request a Quote
                </Link>
              </div>

              <div className="bg-navy-800 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Other Services</h3>
                <div className="space-y-4">
                  {services
                    .filter((s) => s.id !== service.id)
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={`/services/${s.id}`}
                        className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-300 group-hover:text-white transition-colors">
                            {s.title}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
