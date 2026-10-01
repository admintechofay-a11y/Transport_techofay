import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyApi } from '@/lib/api/verify.api';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Truck,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Printer,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/date';

export const PublicVerifyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-token', token],
    queryFn: () => verifyApi.verify(token || ''),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/techofay-logo.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                TECHNOFAY LOGISTICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                OFFICIAL DOCUMENT VERIFICATION PORTAL
              </span>
            </div>
          </div>

          <Link
            to="/home"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {isLoading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 mx-auto rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white">Validating Security Signature...</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Verifying cryptographic HMAC SHA-256 seal & checkpost logs
            </p>
          </div>
        ) : error || !data || !data.valid ? (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md text-center max-w-xl mx-auto w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-900/50 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-red-900/60 text-red-300 border border-red-700/50 inline-block mb-3">
              Verification Failed
            </span>

            <h2 className="text-xl font-bold text-white">Invalid or Tampered Document</h2>
            <p className="text-xs text-red-200/80 mt-2 leading-relaxed">
              {data?.message ||
                'This QR verification token is either corrupted, expired, or has a forged cryptographic signature. Please contact transport security dispatch immediately.'}
            </p>

            <div className="mt-8 pt-6 border-t border-red-900/50 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/home"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Return to Home
              </Link>
              <a
                href="tel:+919359339000"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition flex items-center justify-center gap-2"
              >
                <span>Report to Dispatch (+91 93593 39000)</span>
              </a>
            </div>
          </div>
        ) : (
          /* Verified Document Card */
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Verification Status Banner */}
            <div className="bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-slate-900 px-6 py-5 border-b border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/50">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
                      Cryptographically Authenticated
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      VALID
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white mt-0.5">
                    {data.document_number}
                  </h1>
                </div>
              </div>

              <div className="sm:text-right font-mono text-[11px] text-slate-400">
                <span>Verified: </span>
                <span className="text-slate-200 font-semibold">
                  {data.verified_at ? formatDateTime(data.verified_at) : 'Just now'}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Primary Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Document Type
                  </span>
                  <span className="text-sm font-bold text-amber-300 mt-1 block uppercase">
                    {(data.document_type || 'DOCUMENT').replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Status: <strong className="text-emerald-400 uppercase">{data.status}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Issuing Organization
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block truncate">
                    {data.company_name || 'Technofay Transport'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    GSTIN: 24AOGPP3611Q1Z4
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Assigned Vehicle
                  </span>
                  <span className="text-sm font-mono font-bold text-white mt-1 block">
                    {data.vehicle_plate || 'Unassigned'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Driver: {data.driver_name || 'On Duty Driver'}
                  </span>
                </div>
              </div>

              {/* Specific Details Section */}
              {data.details && (
                <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Security & Movement Log
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {data.pass_type && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Pass Direction:</span>
                        <span className="font-semibold text-white">{data.pass_type}</span>
                      </div>
                    )}
                    {data.details.authorized_by && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Authorized By:</span>
                        <span className="font-semibold text-white">{data.details.authorized_by}</span>
                      </div>
                    )}
                    {data.details.security_name && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Checkpost Security:</span>
                        <span className="font-semibold text-white">{data.details.security_name}</span>
                      </div>
                    )}
                    {data.details.in_time && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Check-in Time:</span>
                        <span className="font-mono text-slate-200">{formatDateTime(data.details.in_time)}</span>
                      </div>
                    )}
                    {data.details.out_time && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Exit Stamped:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{formatDateTime(data.details.out_time)}</span>
                      </div>
                    )}
                    {data.details.total_weight && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Declared Weight:</span>
                        <span className="font-mono text-white font-bold">{data.details.total_weight} MT</span>
                      </div>
                    )}
                    {data.details.received_by && (
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Received By:</span>
                        <span className="font-semibold text-emerald-400">{data.details.received_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Official Seal Footer Note */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This document has been verified against the official Technofay Transport ledger. The cryptographic signature matches the company master authority and has not been altered or revoked.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Verification Receipt</span>
                </button>

                <Link
                  to="/home"
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                >
                  <span>Go to Fleet Console</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>© 2026 Technofay Logistics Solutions • Secure Checkpost & Gate Pass Verification</p>
        <p className="text-slate-400">
          Design and developed by{' '}
          <a
            href="https://techofay-global-ventures.vercel.app/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-saffron-400 hover:text-saffron-300 underline"
          >
            Techofay Global Ventures
          </a>
        </p>
        <p>
          <a
            href="https://techofay-global-ventures.vercel.app/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-slate-500 hover:text-slate-300 underline"
          >
            https://techofay-global-ventures.vercel.app/contact
          </a>
        </p>
      </footer>
    </div>
  );
};

export default PublicVerifyPage;
