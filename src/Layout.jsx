import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Building2, 
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Check,
  Calendar,
  Bell,
  HardHat
} from "lucide-react";
import ContextSwitcher from '@/components/context/ContextSwitcher';
import MessagingNotifications from '@/components/messaging/MessagingNotifications';
import FullPageLoader from '@/components/ui/FullPageLoader';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingContext, setIsChangingContext] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }),
    enabled: !!user?.email,
  });

  const unreadCount = notifications.length;

  const currentCompany = companies.find(c => c.id === user?.active_company_id);
  
  const currentContext = user?.active_context || 'personal';

  const companiesNavItem = currentContext === 'personal'
    ? { name: 'Società', icon: Building2, page: 'Companies', path: createPageUrl('Companies') }
    : { name: 'Società', icon: Building2, page: 'CompanyDetail', path: createPageUrl('CompanyDetail') + `?id=${user?.active_company_id}` };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard', path: createPageUrl('Dashboard') },
    { name: 'Progetti', icon: FolderKanban, page: 'Projects', path: createPageUrl('Projects') },
    { name: 'Calendario', icon: Calendar, page: 'Calendar', path: createPageUrl('Calendar') },
    companiesNavItem,
  ];

  const handleContextChange = async (context, company) => {
    setIsChangingContext(true);
    try {
      await base44.auth.updateMe({
        active_context: context,
        active_company_id: company?.id || null,
      });
      // Invalida TUTTE le query per ricaricare tutti i dati con il nuovo contesto
      await queryClient.invalidateQueries();
      // Ricarica tutte le query attive
      await queryClient.refetchQueries();
    } finally {
      setIsChangingContext(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {isChangingContext && <FullPageLoader message="Cambio contesto in corso..." />}
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 pointer-events-auto">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ef6144] flex items-center justify-center">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-xl text-gray-900 hidden sm:block">EdilSync</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-[#ef6144]/10 text-[#ef6144]' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Messaging Notifications */}
              <MessagingNotifications userEmail={user?.email} />
              
              {/* Notifications */}
              <Link to={createPageUrl('Notifications')}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ef6144] text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Desktop Context Switcher */}
              <div className="hidden md:block">
                <ContextSwitcher
                  currentContext={currentContext}
                  currentCompany={currentCompany}
                  companies={companies}
                  onContextChange={handleContextChange}
                />
              </div>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[#ef6144] text-white text-sm">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => base44.auth.logout()}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-200">
              <ContextSwitcher
                currentContext={currentContext}
                currentCompany={currentCompany}
                companies={companies}
                onContextChange={handleContextChange}
              />
            </div>
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-[#ef6144]/10 text-[#ef6144]' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
    </>
  );
}