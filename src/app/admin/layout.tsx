'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  FileText, 
  LogOut, 
  QrCode, 
  Tv, 
  ShieldAlert, 
  Sparkles, 
  Moon, 
  Tag, 
  Compass, 
  ShieldCheck, 
  UserCheck,
  Volume2,
  VolumeX,
  Menu,
  X,
  Inbox,
  Star,
  Archive,
  BarChart3
} from 'lucide-react';
import { playMysticalChime } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Skip auth check on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (!data.authenticated) {
          router.push('/admin/login');
        } else {
          setAdmin(data.admin);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAdmin((current: any) => {
          if (!current) {
            router.push('/admin/login');
          }
          return current;
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07030e] text-purple-300">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: 'Overview & Queue', icon: Users },
    { href: '/admin/bookings', label: 'Bookings Inbox', icon: Inbox },
    { href: '/admin/content', label: 'Site Content', icon: FileText },
    { href: '/admin/leads', label: 'Leads & VIP List', icon: UserCheck },
    { href: '/admin/testimonials', label: 'Reviews', icon: Star },
    { href: '/admin/analytics', label: 'Click Stats', icon: BarChart3 },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/services', label: 'Services', icon: Compass },
    { href: '/admin/discounts', label: 'Discounts', icon: Tag },
    { href: '/admin/archive', label: 'Event Archive', icon: Archive },
    { href: '/admin/settings', label: 'Settings & Modes', icon: SettingsIcon },
    ...(admin?.role === 'super_admin' ? [
      { href: '/admin/team', label: 'Admins & Permissions', icon: ShieldCheck },
      { href: '/admin/audit', label: 'Audit Log', icon: FileText },
    ] : []),
    { href: '/admin/poster', label: 'Print QR Poster', icon: QrCode },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#07030e] text-gray-100">
      {/* Top Navbar */}
      <header className="border-b border-purple-900/50 bg-[#0d061c]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-purple-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-purple-600 p-0.5 shadow-md">
                <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                  <Moon className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <span className="font-extrabold text-sm sm:text-base text-amber-100 hidden sm:inline">
                The Tarot Reader Admin
              </span>
            </Link>

            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              admin?.role === 'super_admin'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-purple-900 text-purple-200 border border-purple-700'
            }`}>
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/display"
              target="_blank"
              className="text-xs px-2.5 py-1.5 rounded-xl border border-purple-800 bg-purple-950/40 text-purple-200 hover:text-amber-300 flex items-center gap-1.5"
              title="Open Public Stall TV Display"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Open Live TV</span>
            </Link>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                soundEnabled ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-gray-800 text-gray-500'
              }`}
              title="Toggle Sound Alerts"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{admin?.name}</div>
              <div className="text-[10px] text-purple-300/70 font-mono truncate max-w-[120px]">{admin?.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-red-900/60 hover:bg-red-950/50 text-red-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center px-4 overflow-x-auto border-t border-purple-950/60 text-xs gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2.5 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-200 bg-purple-950/30'
                    : 'border-transparent text-purple-300/80 hover:text-white hover:bg-purple-950/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-purple-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="lg:hidden p-3 border-t border-purple-900/60 bg-[#100724] space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2.5 rounded-xl font-semibold text-xs flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/40'
                      : 'text-purple-200 hover:bg-purple-950/40'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
