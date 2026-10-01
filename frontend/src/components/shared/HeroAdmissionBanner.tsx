import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Phone,
  Mail,
  FileText,
  Receipt,
  ChevronDown,
} from 'lucide-react';
import { QuickAdmissionModal } from '@/components/loads/QuickAdmissionModal';
import {
  downloadLoadingSlipPdf,
  downloadTripMemoPdf,
} from '@/lib/pdf-downloader';

interface HeroAdmissionBannerProps {
  onLoadCreated?: (load: any) => void;
}

export const HeroAdmissionBanner: React.FC<HeroAdmissionBannerProps> = ({ onLoadCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
    };
    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplates]);

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-[#0F2D56] via-[#163866] to-[#0A1F3B] py-5 px-6 shadow-xl text-white">
      {/* Subtle Background Glows */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        
        {/* Left Branding & Contact Info */}
        <div className="space-y-1.5 max-w-lg">
          <div className="flex items-center gap-2.5">
            <img
              src="/techofay-logo.png"
              alt="Techofay Logo"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Fleet Operations Console
            </h1>
          </div>

          <p className="text-xs text-slate-300">
            Heavy Road Haulage • Booking Slips • Lorry Trip Memos • 4-Copy Bilties (GST SAC 9965)
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
            <a href="tel:+919359339000" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>+91 93593 39000 / 93776 10333</span>
            </a>
            <a href="mailto:admin.techofay@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              <span>admin.techofay@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Consignment</span>
          </button>

          {/* Templates Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <FileText className="h-4 w-4 text-amber-300" />
              <span>Templates</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-300 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900/95 py-1.5 shadow-2xl backdrop-blur-md z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    downloadLoadingSlipPdf({});
                    setShowTemplates(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  <FileText className="h-4 w-4 text-amber-300" />
                  <span>Loading Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadTripMemoPdf({});
                    setShowTemplates(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  <Receipt className="h-4 w-4 text-emerald-300" />
                  <span>Trip Memo</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Admission Modal */}
      <QuickAdmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onLoadCreated}
      />
    </div>
  );
};
