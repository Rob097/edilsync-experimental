import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useEssentialData } from './useEssentialData';
import { setEssentialMode } from './essential-mode';
import { initializeI18n } from '@/components/i18n/i18nConfig';
import i18next from '@/components/i18n/i18nConfig';
import { I18nextProvider } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ChevronRight, Menu, Settings, Briefcase, Building2, Calendar, House, RefreshCw, User } from 'lucide-react';
import EssentialQuickActions from './EssentialQuickActions';
import LanguageSelector from '@/components/language/LanguageSelector';
import { useLanguage } from '@/components/i18n/useLanguage';
import TourLauncher from '@/components/tour/TourLauncher';
import { getEssentialOnboardingTour } from '@/components/tour/tours/essentialOnboardingTour';
import { useTour } from '@/components/tour/TourProvider';

if (!i18next.isInitialized) {
  initializeI18n();
}

function MenuItem({ icon: Icon, to, label, onClick, onSelect }) {
  const content = (
    <div className="w-full rounded-2xl border border-[#ef6144]/20 bg-white p-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#ef6144]" />
        </div>
        <span className="text-lg font-medium text-gray-900">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-[#ef6144]" />
    </div>
  );

  if (to) {
    return <Link to={to} onClick={onSelect}>{content}</Link>;
  }

  return (
    <button type="button" onClick={() => { onClick?.(); onSelect?.(); }} className="w-full text-left">
      {content}
    </button>
  );
}

export default function EssentialLayout() {
  const { activeTour, currentStep } = useTour();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showContextList, setShowContextList] = useState(false);
  const [isChangingContext, setIsChangingContext] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);

  const {
    user,
    projects,
    contextProjects,
    companies,
    currentContext,
    currentCompany,
    isLoading: isEssentialDataLoading,
  } = useEssentialData();

  useEffect(() => {
    setEssentialMode(true);
  }, []);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isHomePath = location.pathname === '/essenziale' || location.pathname === '/essenziale/';
  const isProjectPath = pathSegments[1] === 'progetti' && !!pathSegments[2];
  const currentProjectId = isProjectPath ? pathSegments[2] : null;
  const showBackButton = !isHomePath && !menuOpen;
  const shouldStartEssentialOnboarding = user
    && !isEssentialDataLoading
    && isHomePath
    && !user.tour_state?.essential_onboarding_completed
    && !user.tour_state?.essential_onboarding_dismissed;
  const hasProjectsInContext = contextProjects.length > 0;
  const hasCompaniesInContext = currentContext === 'company' ? !!currentCompany : companies.length > 0;
  const essentialOnboardingSteps = getEssentialOnboardingTour(currentLanguage, {
    hasProjectsInContext,
    hasCompaniesInContext,
    isCompanyContext: currentContext === 'company',
  }).steps;

  useEffect(() => {
    if (!activeTour || activeTour.id !== 'essential_onboarding') return;

    const step = activeTour.steps[currentStep];
    const route = step?.route;
    if (!route || location.pathname === route) return;

    navigate(route);
  }, [activeTour, currentStep, navigate, location.pathname]);

  const handleBack = () => {
    if (pathSegments.length > 3) {
      navigate(pathSegments.slice(0, -1).join('/') ? `/${pathSegments.slice(0, -1).join('/')}` : '/essenziale');
      return;
    }
    if (isProjectPath) {
      navigate('/essenziale/progetti');
      return;
    }
    if (pathSegments.length <= 2) {
      navigate('/essenziale');
      return;
    }
    navigate(-1);
  };

  const handleContextChange = async (context, company = null) => {
    setIsChangingContext(true);
    try {
      await appClient.auth.updateMe({
        active_context: context,
        active_company_id: company?.id || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setMenuOpen(false);
      setShowContextList(false);
      navigate('/essenziale');
    } finally {
      setIsChangingContext(false);
    }
  };

  const askSwitchToNormalMode = () => {
    setMenuOpen(false);
    setShowContextList(false);
    setSwitchDialogOpen(true);
  };

  const confirmSwitchToNormalMode = () => {
    setEssentialMode(false);
    setSwitchDialogOpen(false);
    navigate('/');
  };

  return (
    <I18nextProvider i18n={i18next}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-[#ef6144]/20 bg-white">
          <div className="h-16 px-4 flex items-center justify-between max-w-4xl mx-auto w-full">
            {showBackButton ? (
              <button type="button" onClick={handleBack} className="flex items-center gap-2 text-gray-800 font-medium">
                <ArrowLeft className="h-5 w-5" />
                <span>{tr('Torna indietro', 'Go back')}</span>
              </button>
            ) : <div className="w-28" />}

            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => {
                  const next = !prev;
                  if (!next) setShowContextList(false);
                  return next;
                });
              }}
              className="flex items-center gap-2 text-lg font-semibold text-[#ef6144]"
              data-tour="essential-menu-toggle"
            >
              <Menu className="h-5 w-5" />
              <span>{menuOpen ? tr('Chiudi Menù', 'Close menu') : tr('Apri Menù', 'Open menu')}</span>
            </button>

            <div className="w-28" />
          </div>
        </header>

        <main className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 space-y-4">
          <TourLauncher
            tourId="essential_onboarding"
            steps={essentialOnboardingSteps}
            trigger={shouldStartEssentialOnboarding}
            delay={1200}
            afterCompleteRoute="/essenziale"
          />

          <div className="rounded-2xl border border-[#ef6144]/20 bg-white px-4 py-4 shadow-sm space-y-3" data-tour="essential-context-card">
            <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
              {currentContext === 'company' ? <Building2 className="h-5 w-5 text-[#ef6144]" /> : <User className="h-5 w-5 text-[#ef6144]" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">{tr('Contesto di lavoro attivo', 'Active work context')}</p>
              <p className="font-semibold text-gray-900">
                {currentContext === 'company'
                  ? `${tr('Società', 'Company')}: ${currentCompany?.name || tr('Società', 'Company')}`
                  : tr('Privato', 'Personal')}
              </p>
            </div>
          </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentContext === 'personal' ? 'default' : 'outline'}
                className={currentContext === 'personal' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'}
                size="sm"
                disabled={isChangingContext || currentContext === 'personal'}
                onClick={() => handleContextChange('personal', null)}
              >
                {tr('Privato', 'Personal')}
              </Button>
              {companies.map((company) => (
                <Button
                  key={company.id}
                  variant={currentContext === 'company' && currentCompany?.id === company.id ? 'default' : 'outline'}
                  className={currentContext === 'company' && currentCompany?.id === company.id ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'}
                  size="sm"
                  disabled={isChangingContext}
                  onClick={() => handleContextChange('company', company)}
                >
                  {company.name}
                </Button>
              ))}
            </div>
          </div>
          <Outlet />
        </main>

        {menuOpen ? (
          <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-gray-50 border-t border-[#ef6144]/20">
            <div className="h-full overflow-y-auto p-5">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">{tr('Menu', 'Menu')}</h2>
              </div>

              {!showContextList ? (
                <div className="space-y-5">
                  <MenuItem icon={House} label={tr('Home', 'Home')} to="/essenziale" onSelect={() => { setMenuOpen(false); setShowContextList(false); }} />
                  <MenuItem icon={Briefcase} label={tr('Progetti', 'Projects')} to="/essenziale/progetti" onSelect={() => { setMenuOpen(false); setShowContextList(false); }} />
                  <MenuItem icon={Building2} label={tr('Società', 'Companies')} to="/essenziale/societa" onSelect={() => { setMenuOpen(false); setShowContextList(false); }} />
                  <MenuItem icon={Calendar} label={tr('Calendario', 'Calendar')} to="/essenziale/calendario" onSelect={() => { setMenuOpen(false); setShowContextList(false); }} />
                  <MenuItem icon={Settings} label={tr('Impostazioni', 'Settings')} to="/Settings" onSelect={() => { setMenuOpen(false); setShowContextList(false); }} />
                  <MenuItem icon={RefreshCw} label={tr('Cambia contesto', 'Change context')} onClick={() => setShowContextList(true)} />

                  <div className="rounded-2xl border border-[#ef6144]/20 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 mb-2">{tr('Lingua', 'Language')}</p>
                    <LanguageSelector />
                  </div>

                  <div className="pt-4 border-t border-[#ef6144]/20">
                    <Button
                      variant="outline"
                      className="w-full border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10"
                      onClick={askSwitchToNormalMode}
                      data-tour="essential-switch-normal"
                    >
                      {tr('Passa a modalità Normale', 'Switch to Normal mode')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button type="button" onClick={() => setShowContextList(false)} className="flex items-center gap-2 text-gray-700 font-medium">
                    <ArrowLeft className="h-4 w-4" />
                    {tr('Torna al menu', 'Back to menu')}
                  </button>

                  <button
                    type="button"
                    className="w-full rounded-2xl border border-[#ef6144]/20 bg-white p-4 text-left shadow-sm"
                    disabled={isChangingContext}
                    onClick={() => handleContextChange('personal', null)}
                  >
                    <div className="font-semibold">{tr('Privato', 'Personal')}</div>
                    <div className="text-sm text-gray-500">{tr('Usa il contesto personale', 'Use personal context')}</div>
                  </button>

                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      className="w-full rounded-2xl border border-[#ef6144]/20 bg-white p-4 text-left shadow-sm"
                      disabled={isChangingContext}
                      onClick={() => handleContextChange('company', company)}
                    >
                      <div className="font-semibold">{company.name}</div>
                      <div className="text-sm text-gray-500">{tr('Usa il contesto società', 'Use company context')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr('Passare alla modalità Normale?', 'Switch to Normal mode?')}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            {tr('Tornerai all\'interfaccia completa della modalità Normale.', 'You will return to the full Normal mode interface.')}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              {tr('Annulla', 'Cancel')}
            </Button>
            <Button className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={confirmSwitchToNormalMode}>
              {tr('Conferma', 'Confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EssentialQuickActions projects={projects} currentProjectId={currentProjectId} />
    </I18nextProvider>
  );
}
