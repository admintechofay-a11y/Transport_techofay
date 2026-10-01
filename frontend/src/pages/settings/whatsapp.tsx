import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  ShieldCheck,
  Save,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api/settings.api';

interface WhatsAppSettings {
  provider: string;
  apiKey: string;
  senderNumber: string;
  lrTemplate: string;
  biltyTemplate: string;
  challanTemplate: string;
  podTemplate: string;
  paymentReminderTemplate: string;
}

const DEFAULT_SETTINGS: WhatsAppSettings = {
  provider: 'interakt',
  apiKey: 'interakt_live_sk_99a8b7c6d5e4f3a2b1c0d9e8',
  senderNumber: '+919820011223',
  lrTemplate:
    'Dear {{consignor_name}}, your Lorry Receipt (LR) #{{lr_number}} for shipment from {{from_city}} to {{to_city}} has been generated. Truck: {{vehicle_plate}}. Track consignment live: {{tracking_url}}',
  biltyTemplate:
    'Dear {{consignor_name}}, official consignment Bilty #{{bilty_number}} for LR #{{lr_number}} has been issued. Total Freight: ₹{{total_freight}}, Advance Paid: ₹{{advance_amount}}, Balance Due: ₹{{balance_amount}}. Download PDF: {{bilty_pdf_url}}',
  challanTemplate:
    'Dear {{consignee_name}}, Delivery Challan #{{challan_number}} for shipment #{{order_number}} is dispatched via Truck {{vehicle_plate}}. Please arrange receiving gate clearance.',
  podTemplate:
    'DELIVERY CONFIRMATION: Consignment #{{order_number}} has been successfully delivered and acknowledged by {{receiver_name}} on {{delivery_date}}. POD verified.',
  paymentReminderTemplate:
    'PAYMENT REMINDER: Dear {{customer_name}}, an outstanding freight balance of ₹{{due_amount}} is pending for your account. Please remit to HDFC Bank A/C: 50200049281044, IFSC: HDFC0001024. Thank you, TECHOFAY GLOBAL VENTURES.',
};

export const WhatsAppSettingsPage: React.FC = () => {
  const [provider, setProvider] = useState(DEFAULT_SETTINGS.provider);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(DEFAULT_SETTINGS.apiKey);
  const [senderNumber, setSenderNumber] = useState(DEFAULT_SETTINGS.senderNumber);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [lrTemplate, setLrTemplate] = useState(DEFAULT_SETTINGS.lrTemplate);
  const [biltyTemplate, setBiltyTemplate] = useState(DEFAULT_SETTINGS.biltyTemplate);
  const [challanTemplate, setChallanTemplate] = useState(DEFAULT_SETTINGS.challanTemplate);
  const [podTemplate, setPodTemplate] = useState(DEFAULT_SETTINGS.podTemplate);
  const [paymentReminderTemplate, setPaymentReminderTemplate] = useState(DEFAULT_SETTINGS.paymentReminderTemplate);

  useEffect(() => {
    let mounted = true;
    settingsApi
      .getWhatsApp()
      .then((cfg: any) => {
        if (!mounted || !cfg) return;
        if (cfg.provider) setProvider(cfg.provider);
        if (cfg.from_number || cfg.sender_number) setSenderNumber(cfg.from_number || cfg.sender_number);
        const tmpls = cfg.templates || {};
        if (tmpls.lr_template || tmpls.lrTemplate) {
          setLrTemplate(tmpls.lr_template || tmpls.lrTemplate);
        }
        if (tmpls.bilty_template || tmpls.biltyTemplate) {
          setBiltyTemplate(tmpls.bilty_template || tmpls.biltyTemplate);
        }
        if (tmpls.challan_template || tmpls.challanTemplate) {
          setChallanTemplate(tmpls.challan_template || tmpls.challanTemplate);
        }
        if (tmpls.pod_template || tmpls.podTemplate) {
          setPodTemplate(tmpls.pod_template || tmpls.podTemplate);
        }
        if (tmpls.payment_reminder_template || tmpls.paymentReminderTemplate) {
          setPaymentReminderTemplate(tmpls.payment_reminder_template || tmpls.paymentReminderTemplate);
        }
      })
      .catch(() => {
        // Fallback gracefully to default templates if not initialized yet
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleTestConnection = async () => {
    if (!senderNumber) {
      toast.error('Please enter a recipient / sender number for the test ping');
      return;
    }
    setIsTesting(true);
    try {
      const res = await settingsApi.testWhatsApp(senderNumber, 'Test ping from Technofay Logistics WhatsApp Gateway.');
      toast.success(res?.message || `WhatsApp API connection verified! Test ping delivered to ${senderNumber}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to dispatch test message');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      provider,
      api_key: apiKey,
      from_number: senderNumber,
      is_whatsapp_enabled: true,
      templates: {
        lr_template: lrTemplate,
        bilty_template: biltyTemplate,
        challan_template: challanTemplate,
        pod_template: podTemplate,
        payment_reminder_template: paymentReminderTemplate,
      },
    };
    try {
      await settingsApi.updateWhatsApp(payload);
      toast.success('WhatsApp Gateway configuration and all 5 message templates saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Could not save WhatsApp settings to server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-600" />
          WhatsApp Gateway & Automation Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure direct WhatsApp notification dispatch for LRs, Bilties, Delivery Challans, POD acknowledgments, and payment reminders
        </p>
      </div>

      {/* Gateway API Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Gateway Provider Credentials
            </h3>
            <p className="text-xs text-slate-500">Select business API provider and configure webhook secret</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Live Dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp Business BSP Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
            >
              <option value="wati">Wati.io (Official Meta BSP for Logistics)</option>
              <option value="gupshup">Gupshup Enterprise Transport API</option>
              <option value="twilio">Twilio Programmable WhatsApp Messaging</option>
              <option value="interakt">Interakt / Jio Haptik</option>
              <option value="webhook">Custom Indian SMS/WhatsApp Webhook Gateway</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sender Business Number (with country code)
            </label>
            <input
              type="text"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              API Secret Key / Access Token
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            End-to-end encrypted transport message triggers enabled
          </span>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            {isTesting ? 'Sending Test Message...' : 'Send Test Ping'}
          </button>
        </div>
      </div>

      {/* Message Templates Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Automated Message Templates
          </h3>
          <p className="text-xs text-slate-500">
            Use tags like <code className="text-amber-600">{"{{consignor_name}}"}</code>, <code className="text-amber-600">{"{{lr_number}}"}</code>, <code className="text-amber-600">{"{{balance_amount}}"}</code> to personalize dispatches
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1. Lorry Receipt (LR) Generated Notification
            </label>
            <textarea
              rows={2}
              value={lrTemplate}
              onChange={(e) => setLrTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              2. Consignment Bilty Issued Notification
            </label>
            <textarea
              rows={2}
              value={biltyTemplate}
              onChange={(e) => setBiltyTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              3. Delivery Challan (DC) Dispatched Notification
            </label>
            <textarea
              rows={2}
              value={challanTemplate}
              onChange={(e) => setChallanTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              4. Proof of Delivery (POD) Verified & Delivered
            </label>
            <textarea
              rows={2}
              value={podTemplate}
              onChange={(e) => setPodTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              5. Outstanding Freight Dues & Bank Remittance Reminder
            </label>
            <textarea
              rows={2}
              value={paymentReminderTemplate}
              onChange={(e) => setPaymentReminderTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          {isSaving ? 'Saving Settings...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};
