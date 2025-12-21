"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { contactInfo } from "@/lib/data";

export function TopBar() {
  return (
    <div className="bg-navy-900 border-b border-white/5 py-2 hidden md:block">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center text-xs font-medium text-gray-400">
        <div className="flex items-center gap-6">
          <a 
            href={`mailto:${contactInfo.email}`} 
            className="flex items-center gap-2 hover:text-orange-500 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {contactInfo.email}
          </a>
          <a 
            href={`tel:${contactInfo.phone}`} 
            className="flex items-center gap-2 hover:text-orange-500 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {contactInfo.phone}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>Serving North America</span>
        </div>
      </div>
    </div>
  );
}
