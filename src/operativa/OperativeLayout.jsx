import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { initializeI18n } from '@/components/i18n/i18nConfig';
import i18next from '@/components/i18n/i18nConfig';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HardHat, Monitor, Menu, X, Building2, Briefcase } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { setUiMode, UI_MODES } from '@/lib/ui-mode';
import { useOperativeData } from './useOperativeData';
import LanguageSelector from '@/components/language/LanguageSelector';

if (!i18next.isInitialized) {
  initializeI18n();
}

export default function OperativeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [isChangingContext, setIsChangingContext] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    user,
    currentContext,
    companies,
    currentCompany,
    contextProjects,
    isLoading,
  } = useOperativeData();

  useEffect(() => {
    setUiMode(UI_MODES.OPERATIONAL);
  }, []);

  const handleContextChange = async (company) => {
    setIsChangingContext(true);
    try {
      await appClient.auth.updateMe({
        active_context: 'company',
        active_company_id: company.id,
      });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
      await queryClient.invalidateQueries({ queryKey: ['operativeProjects'] });
      navigate('/app/operativa', { replace: true });
    } finally {
      setIsChangingContext(false);
    }
  };

  const switchToNormal = () => {
    setUiMode(UI_MODES.NORMAL);
    navigate('/app');
  };

  const goToProject = (projectId) => {
    setMenuOpen(false);
    navigate(`/app/operativa/progetto/${projectId}`);
  };

  const goToSummary = () => {
    setMenuOpen(false);
    navigate('/app/operativa/riepilogo');
  };

  const goToCompanyWorkspace = () => {
    setMenuOpen(false);
    navigate('/app/operativa/societa');
  };

  const handleCompanyChangeFromMenu = async (company) => {
    await handleContextChange(company);
    setMenuOpen(false);
  };

  const selectedProjectId = location.pathname.startsWith('/app/operativa/progetto/')
    ? location.pathname.split('/')[4]
    : null;

  const showCompanyGuard = !isLoading && (currentContext !== 'company' || !currentCompany);

  return (
    <I18nextProvider i18n={i18next}>
      <div className="app-shell min-h-screen">
        <header className="app-topbar sticky top-0 z-40 border-b">
          <div className="px-4 h-14 flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef6144,#d9553a)] shadow-[0_16px_32px_rgba(217,85,58,0.24)]">
                <HardHat className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b2553f]">{t('operationalMode.headerMode')}</p>
                <p className="max-w-[180px] truncate text-sm font-semibold tracking-[-0.02em] text-[#231b18]">{currentCompany?.name || t('operationalMode.companyRequiredTitle')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {showCompanyGuard ? (
          <main className="max-w-md mx-auto px-4 py-4">
            <Card className="app-panel">
              <CardContent className="p-4 space-y-3">
                <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#231b18]">{t('operationalMode.companyRequiredTitle')}</h1>
                <p className="text-sm leading-6 text-[#6d5c55]">{t('operationalMode.companyRequiredDescription')}</p>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <Button
                      key={company.id}
                      className="w-full"
                      onClick={() => handleContextChange(company)}
                      disabled={isChangingContext}
                    >
                      {company.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        ) : (
          <main className="max-w-md mx-auto overflow-visible px-4 py-4 pb-24">
            <Outlet />
          </main>
        )}

        {menuOpen && (
          <div className="fixed inset-0 z-50 app-shell overflow-y-auto">
            <div className="max-w-md mx-auto px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#231b18]">{t('operational.menuTitle')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <Card className="app-panel">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#231b18]">{t('operational.menuModes')}</h3>
                  <Button variant="outline" className="w-full" onClick={switchToNormal}>
                    <Monitor className="h-4 w-4 mr-2" />
                    {t('operationalMode.fullModeLabel')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="app-panel">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#231b18]">{t('settings.language')}</h3>
                  <LanguageSelector />
                  <Button variant="outline" className="w-full" onClick={goToCompanyWorkspace}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Società
                  </Button>
                </CardContent>
              </Card>

              {companies.length > 1 && (
                <Card className="app-panel">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-[#231b18]">{t('operational.changeCompany')}</h3>
                    {companies.map((company) => (
                      <Button
                        key={company.id}
                        variant={currentCompany?.id === company.id ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleCompanyChangeFromMenu(company)}
                        disabled={isChangingContext}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {company.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {contextProjects.length > 1 && (
                <Card className="app-panel">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-[#231b18]">{t('operational.changeProject')}</h3>
                    <Button variant="outline" className="w-full" onClick={goToSummary}>
                      {t('operational.daySummary')}
                    </Button>
                    {contextProjects.map((project) => (
                      <Button
                        key={project.id}
                        variant={selectedProjectId === project.id ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => goToProject(project.id)}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        {project.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </I18nextProvider>
  );
}
