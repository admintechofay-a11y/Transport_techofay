import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, FileText, Truck, UserCheck, Package, Building2 } from 'lucide-react';
import { searchApi, SearchResultItem } from '@/lib/api/search.api';
import { useUIStore } from '@/stores/ui.store';

export const GlobalSearch: React.FC = () => {
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Listen for Cmd+K or Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  // Focus input on open
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [globalSearchOpen]);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search(query, 12);
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setGlobalSearchOpen(false);
    // Route mapping
    if (item.type === 'LR Number') {
      navigate('/lr-numbers');
    } else if (item.type === 'Bilty') {
      navigate('/bilties');
    } else if (item.type === 'Order') {
      navigate('/loads');
    } else if (item.type === 'Vehicle' || item.type === 'Vehicle Document') {
      navigate('/vehicles');
    } else if (item.type === 'Driver') {
      navigate('/drivers');
    } else if (item.type === 'Contact') {
      navigate('/customers');
    } else {
      navigate('/dashboard');
    }
  };

  const getResultIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
        return <Package className="w-4 h-4 text-accent" />;
      case 'lr number':
      case 'bilty':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'vehicle':
      case 'vehicle document':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'driver':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!globalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 gap-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
              } else if (e.key === 'Enter' && results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
              }
            }}
            placeholder="Search LR numbers, loads, bilties, vehicles, drivers, parties... (⌘K)"
            className="flex-1 bg-transparent border-none text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-gray-100">
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  selectedIndex === index ? 'bg-primary/5 text-primary-dark font-medium' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">{getResultIcon(item.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 font-mono-code">{item.label}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {item.type}
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            ))
          ) : query.trim() && !loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No transport records found for <span className="font-semibold text-gray-600">"{query}"</span>.
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-gray-400">Quickly find and jump to any consignment or asset.</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-gray-400 font-mono">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">LR-2026-XXXXXX</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">LOAD-2026-XXXXXX</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">MH-04-AB-XXXX</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-100">
          <span>Navigate with ↑ and ↓, Enter to select</span>
          <span className="font-mono">Techofay Fleet Intelligence</span>
        </div>
      </div>
    </div>
  );
};
