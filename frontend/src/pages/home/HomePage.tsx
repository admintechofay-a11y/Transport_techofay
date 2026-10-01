import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  FileText,
  Users,
  IndianRupee,
  ClipboardCheck,
  ShieldCheck,
  Camera,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Star,
  Play,
  Sparkles,
  ChevronRight,
  Shield,
  FileSignature,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Package,
      title: 'Load Management',
      description: 'Create and track consignments end-to-end with real-time waypoint progression.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: FileSignature,
      title: 'LR & Bilty Generation',
      description: 'Statutory 4-copy bilty with GST SAC 9965 and custom freight breakups.',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: Truck,
      title: 'Fleet Management',
      description: 'Track heavy commercial vehicles, fitness certificates, insurance & national permits.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Users,
      title: 'Driver Management',
      description: 'Roster tracking, commercial license renewals & automated duty allocation.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: IndianRupee,
      title: 'Freight Billing',
      description: 'Automated freight charges, advance deductions & customer party statements.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: ClipboardCheck,
      title: 'Delivery Challans',
      description: 'Material acknowledgment slips and comprehensive dispatch inventory records.',
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      icon: ShieldCheck,
      title: 'Gate Passes',
      description: 'Depot and warehouse entry/exit security verification passes.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Camera,
      title: 'POD Management',
      description: 'Digital Proof of Delivery upload, signature capture & instant freight clearance.',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Corridor utilization, revenue insights & automated compliance export reports.',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create Load',
      desc: 'Input consignor, consignee, material details & freight terms.',
    },
    {
      num: '02',
      title: 'Assign Fleet & Driver',
      desc: 'Allocate available HCV/LCV trucks & active commercial drivers.',
    },
    {
      num: '03',
      title: 'Generate LR / Bilty',
      desc: 'Issue digital PDF documents with GST SAC 9965 carriage terms.',
    },
    {
      num: '04',
      title: 'Verify POD & Close',
      desc: 'Capture stamped delivery acknowledgment & settle freight balances.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* 1. NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-3.5 border-b border-slate-200'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="h-10 w-10 rounded-xl bg-[#0F2D56] p-1 flex items-center justify-center border border-white/20 shadow-md">
              <img
                src="/techofay-logo.png"
                alt="Techofay"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-white font-black text-lg">T</span>
            </div>
            <div>
              <span className={`font-black text-sm tracking-wider block transition-colors ${scrolled ? 'text-[#0F2D56]' : 'text-amber-300'}`}>
                TECHOFAY GLOBAL VENTURES
              </span>
              <span className={`text-[10px] font-semibold tracking-widest uppercase block ${scrolled ? 'text-slate-500' : 'text-slate-300'}`}>
                Fleet &amp; Transport Operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                scrolled
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-white hover:text-white hover:bg-white/10'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-black shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 bg-gradient-to-br from-[#0F2D56] via-[#163866] to-[#091D38] text-white overflow-hidden">
        {/* Animated Ambience Circles */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold text-amber-300 shadow-md mb-8">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>🚛 India's Smart Transport Management Platform</span>
          </div>

          {/* Main H1 Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Fleet Operations. Freight Dispatch. <span className="text-[#F97316]">One Console.</span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From statutory 4-copy LR generation to real-time POD verification, manage your entire heavy road freight operation in one high-performance terminal. Built for Indian commercial haulage.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-black shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Start Free Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white text-sm font-bold backdrop-blur-sm transition"
            >
              <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>View Live Demo</span>
            </button>
          </div>

          {/* Key Stats Bar */}
          <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-2xl lg:text-3xl font-black text-amber-300 font-mono">500+</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Vehicles Tracked</p>
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-black text-amber-300 font-mono">10,000+</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">LRs Generated</p>
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-black text-amber-300 font-mono">₹50Cr+</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Freight Managed</p>
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono">99.9%</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Operational Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F97316]">
              COMPREHENSIVE CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
              Everything Your Transport Business Needs
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              A unified operating stack tailored specifically for Indian road transport regulations, GST compliance, and multi-tier freight charging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-7 rounded-2xl border border-slate-200 bg-white hover:border-[#F97316]/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0F2D56] transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F97316]">
              STREAMLINED DISPATCH
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              How Techofay Transport Works
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              End-to-end trip execution cycle in 4 seamless steps. No spreadsheets required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0F2D56] text-white flex items-center justify-center font-mono font-black text-sm mb-4">
                    {s.num}
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{s.title}</h4>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All steps in one platform. Real-time updates via WhatsApp &amp; SMS.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 5. COMPANY INFO STRIP */}
      <section className="py-16 bg-[#0F2D56] text-white border-b border-[#1A4080]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Shield className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-black text-white">TECHOFAY GLOBAL VENTURES</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Registered Transport Operations &amp; Commercial Fleet Management Hub.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F97316]" />
                <span>Golden Chokdi, Vadodara, Gujarat 390024</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>+91 93593 39000 / 93776 10333</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>info@techofay.com</span>
              </div>
              <span className="font-mono bg-white/10 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-200">
                PAN: AAQFT0976Q
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER CTA */}
      <footer className="py-16 bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#C2410C] text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Modernize Your Transport Business?
          </h2>
          <p className="mt-3 text-sm text-orange-100 max-w-xl mx-auto">
            Experience computerized Bilties, automated WhatsApp alerts, and verified proof-of-delivery records in seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 rounded-xl bg-white text-[#EA580C] text-sm font-black shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 rounded-xl border border-white/40 text-white text-sm font-bold hover:bg-white/10 transition"
            >
              Contact Sales
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-white/20 text-center space-y-1">
            <p className="text-xs text-orange-100">
              Design and developed by{' '}
              <a
                href="https://techofay-global-ventures.vercel.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:text-white"
              >
                Techofay Global Ventures
              </a>
            </p>
            <p>
              <a
                href="https://techofay-global-ventures.vercel.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-orange-200 hover:text-white underline"
              >
                https://techofay-global-ventures.vercel.app/contact
              </a>
            </p>
            <p className="mt-3 text-[11px] text-orange-200/80">
              &copy; {new Date().getFullYear()} Techofay Global Ventures. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
