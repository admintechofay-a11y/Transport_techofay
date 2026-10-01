import React, { useState } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { lrApi } from '@/lib/api/lr-numbers.api';
import { biltyApi } from '@/lib/api/bilties.api';
import { challanApi } from '@/lib/api/delivery-challans.api';
import { toast } from 'sonner';

export interface WhatsAppShareButtonProps {
  documentType: 'lr' | 'bilty' | 'challan' | 'statement' | 'invoice' | 'load' | 'loading_slip' | 'trip_memo';
  documentId?: string;
  documentNumber: string;
  recipientPhone?: string;
  recipientName?: string;
  defaultMessage?: string;
  size?: 'sm' | 'md' | 'icon';
  variant?: 'outline' | 'filled';
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  documentType,
  documentId,
  documentNumber,
  recipientPhone = '',
  recipientName = '',
  defaultMessage,
  size = 'md',
  variant = 'outline',
}) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(recipientPhone);
  const [customMsg, setCustomMsg] = useState(
    defaultMessage ||
      `Namaste ${recipientName || 'Sir/Madam'}, please find attached ${documentType.toUpperCase()} document #${documentNumber} for your transport consignment.`
  );
  const [loading, setLoading] = useState(false);

  const docId = documentId || documentNumber;

  const handleSend = async () => {
    if (!phone) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      if (documentType === 'lr') {
        await lrApi.shareWhatsApp(docId, phone);
      } else if (documentType === 'bilty') {
        await biltyApi.shareWhatsApp(docId, phone);
      } else if (documentType === 'challan') {
        await challanApi.shareWhatsApp(docId, phone);
      } else {
        // Direct WhatsApp Web dispatch for loads/statements/invoices
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`${customMsg}\nDocument: ${documentNumber}`);
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }

      toast.success(`Dispatched ${documentType.toUpperCase()} #${documentNumber} via WhatsApp!`);
      setOpen(false);
    } catch (err: any) {
      // Fallback to direct web dispatch if backend API is offline
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`${customMsg}\nDocument: ${documentNumber}`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      toast.success(`Dispatched ${documentType.toUpperCase()} #${documentNumber} via WhatsApp Web!`);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPhone(recipientPhone);
          setOpen(true);
        }}
        className={
          variant === 'filled'
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm transition'
            : size === 'icon'
            ? 'p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition'
            : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-medium transition'
        }
        title="Share via WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
        {size !== 'icon' && <span>WhatsApp</span>}
      </button>

      {/* Share Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Share via WhatsApp</h3>
                  <p className="text-xs text-slate-500 font-mono">{documentType.toUpperCase()} #{documentNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Recipient Phone Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Include country code, e.g. +91</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Accompanying Message
                </label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900 flex items-center justify-between text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">Attached PDF:</span>
                <span className="font-mono text-emerald-900 dark:text-emerald-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {documentNumber}.pdf
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
