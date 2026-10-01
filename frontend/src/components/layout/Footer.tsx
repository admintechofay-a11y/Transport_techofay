import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  className?: string;
  variant?: 'light' | 'dark' | 'orange';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'light' }) => {
  const isDark = variant === 'dark';
  const isOrange = variant === 'orange';

  const textColor = isOrange
    ? 'text-orange-100'
    : isDark
    ? 'text-slate-400'
    : 'text-slate-500 dark:text-slate-400';

  const linkColor = isOrange
    ? 'text-white hover:text-orange-200 underline decoration-white/50'
    : isDark
    ? 'text-amber-400 hover:text-amber-300 hover:underline'
    : 'text-saffron-600 dark:text-saffron-400 hover:text-saffron-700 dark:hover:text-saffron-300 hover:underline';

  return (
    <footer
      className={`py-4 px-6 text-center text-xs border-t transition-colors ${
        isOrange
          ? 'border-white/20 bg-transparent'
          : isDark
          ? 'border-slate-800 bg-slate-950/80 backdrop-blur-xs'
          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
        <span className={textColor}>Design and developed by</span>
        <a
          href="https://techofay-global-ventures.vercel.app/contact"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-semibold inline-flex items-center gap-1 transition-colors ${linkColor}`}
        >
          <span>Techofay Global Ventures</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <span className={`hidden sm:inline ${textColor}`}>•</span>
        <a
          href="https://techofay-global-ventures.vercel.app/contact"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[11px] font-mono transition-colors opacity-90 hover:opacity-100 ${linkColor}`}
        >
          https://techofay-global-ventures.vercel.app/contact
        </a>
      </div>
    </footer>
  );
};

export default Footer;
