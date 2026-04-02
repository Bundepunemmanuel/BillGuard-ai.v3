import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FileSearch, History, BarChart3, Settings, LogOut, CreditCard, Menu, X, ChevronLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from './utils';

const navItems = [
  { icon: FileSearch, label: 'New Audit', path: '/' },
  { icon: History, label: 'History', path: '/history' },
  { icon: LayoutDashboard, label: 'Risk Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'Cost Intelligence', path: '/cost' },
  { icon: CreditCard, label: 'Pricing', path: '/pricing' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-background">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 bg-surface border-r border-white/10 flex flex-col transition-all duration-300',
        // Desktop: collapsible
        'hidden md:flex',
        sidebarOpen ? 'md:w-64' : 'md:w-16',
        // Mobile: full width drawer
        mobileOpen && '!flex w-64'
      )}>
        {/* Logo row */}
        <div className={cn(
          'flex items-center border-b border-white/10 h-16',
          sidebarOpen || mobileOpen ? 'px-4 gap-3 justify-between' : 'px-0 justify-center'
        )}>
          {(sidebarOpen || mobileOpen) && (
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center border border-gold/30 flex-shrink-0">
                <Shield className="text-gold fill-gold" size={18} />
              </div>
              <span className="font-bold text-base tracking-tight truncate">
                BillGuard <span className="text-primary">AI</span>
              </span>
            </Link>
          )}

          {/* Toggle button */}
          <button
            onClick={() => {
              if (mobileOpen) setMobileOpen(false);
              else setSidebarOpen(!sidebarOpen);
            }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all flex-shrink-0"
          >
            {mobileOpen ? <X size={18} /> : sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={!sidebarOpen && !mobileOpen ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all group',
                  sidebarOpen || mobileOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {(sidebarOpen || mobileOpen) && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className={cn(
          'border-t border-white/10 p-2',
        )}>
          {(sidebarOpen || mobileOpen) && user?.email && (
            <p className="text-xs text-white/30 px-3 py-1 truncate">{user.email}</p>
          )}
          <button
            onClick={handleSignOut}
            title={!sidebarOpen && !mobileOpen ? 'Sign Out' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg transition-all text-white/60 hover:text-danger hover:bg-danger/5 w-full',
              sidebarOpen || mobileOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            )}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {(sidebarOpen || mobileOpen) && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-14 bg-surface border-b border-white/10 flex items-center px-4 gap-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center border border-gold/30">
            <Shield className="text-gold fill-gold" size={14} />
          </div>
          <span className="font-bold text-sm">BillGuard <span className="text-primary">AI</span></span>
        </div>
      </div>

      {/* Main content */}
      <main className={cn(
        'flex-1 overflow-y-auto transition-all duration-300',
        'pt-14 md:pt-0',
        sidebarOpen ? 'md:ml-64' : 'md:ml-16'
      )}>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
