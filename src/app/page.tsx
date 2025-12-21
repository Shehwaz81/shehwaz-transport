import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Services } from "@/components/sections/Services";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-navy-900">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <Contact />
      
      {/* Footer Placeholder */}
      <footer className="py-12 bg-black text-center text-gray-500 border-t border-white/10">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Shehwaz Transport Inc. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
