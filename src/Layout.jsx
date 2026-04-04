import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { initializeI18n } from '@/components/i18n/i18nConfig';
import i18next from '@/components/i18n/i18nConfig';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from '@/components/i18n/useLanguage';

// Initialize i18n once
if (!i18next.isInitialized) {
  initializeI18n();
}
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
  Calendar,
  Bell,
  HardHat
} from "lucide-react";
import ContextSwitcher from '@/components/context/ContextSwitcher';
import MessagingNotifications from '@/components/messaging/MessagingNotifications';
import FullPageLoader from '@/components/ui/FullPageLoader';
import CookieBanner from '@/components/legal/CookieBanner';
import Footer from '@/components/legal/Footer';
import AssistantFloatingButton from '@/components/assistant/AssistantFloatingButton';
import LanguageSelector from '@/components/language/LanguageSelector';
import TourProvider from '@/components/tour/TourProvider';
import TourOverlay from '@/components/tour/TourOverlay';
import { setUiMode, UI_MODES } from '@/lib/ui-mode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingContext, setIsChangingContext] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchModeTarget, setSwitchModeTarget] = useState(null);
  const { t, currentLanguage } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email, currentContext, user?.active_company_id],
    queryFn: () => {
      const filter = {
        user_email: user?.email,
        is_read: false,
        context_type: currentContext,
      };
      
      // If in company context, also filter by company_id
      if (currentContext === 'company' && user?.active_company_id) {
        filter.context_company_id = user.active_company_id;
      }
      
      return appClient.entities.Notification.filter(filter);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000, // 30 secondi
    refetchInterval: 60 * 1000, // Ricontrolla ogni minuto
  });

  const unreadCount = notifications.length;

  const companiesNavItem = currentContext === 'personal'
    ? { name: t('navigation.companies'), icon: Building2, page: 'Companies', path: createPageUrl('Companies') }
    : { name: t('navigation.companies'), icon: Building2, page: 'CompanyDetail', path: createPageUrl('CompanyDetail') + `?id=${user?.active_company_id}` };

  const navItems = [
    { name: t('navigation.dashboard'), icon: LayoutDashboard, page: 'Dashboard', path: createPageUrl('Dashboard') },
    { name: t('navigation.projects'), icon: FolderKanban, page: 'Projects', path: createPageUrl('Projects') },
    { name: t('navigation.calendar'), icon: Calendar, page: 'Calendar', path: createPageUrl('Calendar') },
    companiesNavItem,
  ];

  const handleContextChange = async (context, company) => {
    setIsChangingContext(true);
    try {
      await appClient.auth.updateMe({
        active_context: context,
        active_company_id: company?.id || null,
      });
      
      // Redirect to Dashboard and reload the entire page
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Failed to change context:', error);
      setIsChangingContext(false);
    }
  };

  const switchToOperationalMode = () => {
    setSwitchModeTarget(UI_MODES.OPERATIONAL);
    setSwitchDialogOpen(true);
  };

  const confirmModeSwitch = () => {
    if (!switchModeTarget) return;

    setUiMode(switchModeTarget);
    setSwitchDialogOpen(false);
    setSwitchModeTarget(null);
    navigate('/app/operativa');
  };

  const switchDialogTitle = t('operationalMode.switchDialogTitle');

  const switchDialogDescription = t('operationalMode.switchDialogDescription');

  const switchDialogConfirm = t('operationalMode.switchDialogConfirm');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <I18nextProvider i18n={i18next}>
      <TourProvider>
        {isChangingContext && <FullPageLoader message={currentLanguage === 'it' ? 'Cambio contesto in corso...' : 'Changing context...'} />}
        <TourOverlay />
        <div className="app-shell min-h-screen flex flex-col">
      {/* Header */}
      <header className="app-topbar sticky top-0 z-50 border-b pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 pointer-events-auto">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef6144,#d9553a)] shadow-[0_18px_36px_rgba(217,85,58,0.24)]">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#b2553f]">Workspace</span>
                <span className="block text-lg font-semibold tracking-[-0.03em] text-[#231b18]">EdilSync</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={item.path}
                    data-tour={item.page === 'Dashboard' ? 'nav-dashboard' : undefined}
                    className={`
                      flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors
                      ${isActive 
                        ? 'bg-[rgba(239,97,68,0.12)] text-[#d9553a]' 
                        : 'text-[#6d5c55] hover:bg-[rgba(109,92,85,0.08)] hover:text-[#231b18]'
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
              <div data-tour="messaging">
                <MessagingNotifications userEmail={user?.email} />
              </div>
              
              {/* Notifications */}
              <Link to={createPageUrl('Notifications')} data-tour="notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-[#6d5c55]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ef6144] text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Desktop Context Switcher */}
              <div className="hidden lg:block" data-tour="context-switcher">
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
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-tour="user-menu-trigger">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[linear-gradient(135deg,#ef6144,#d9553a)] text-white text-sm">
                        {getInitials(user?.display_name || user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.display_name || user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('navigation.settings')}
                    </Link>
                  </DropdownMenuItem>
                  {currentContext === 'company' && (
                    <DropdownMenuItem onClick={switchToOperationalMode} className="cursor-pointer">
                      <HardHat className="h-4 w-4 mr-2" />
                      {t('operationalMode.switchMenuItem')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <LanguageSelector />
                  </div>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('SystemDashboard')} className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          {t('navigation.systemDashboard')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => appClient.auth.logout()}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
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
                      flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors
                      ${isActive 
                        ? 'bg-[rgba(239,97,68,0.12)] text-[#d9553a]' 
                        : 'text-[#6d5c55] hover:bg-[rgba(109,92,85,0.08)] hover:text-[#231b18]'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 w-full overflow-x-clip overflow-y-visible">
        {children}
      </main>

      <Footer />
      <CookieBanner />
      <AssistantFloatingButton />

      <Dialog open={switchDialogOpen} onOpenChange={(open) => {
        setSwitchDialogOpen(open);
        if (!open) setSwitchModeTarget(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{switchDialogTitle}</DialogTitle>
            <DialogDescription>
              {switchDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmModeSwitch}>
              {switchDialogConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </TourProvider>
    </I18nextProvider>
  );
}