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
import { setUiMode, UI_MODES } from '@/essential/essential-mode';
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
      navigate('/operativa', { replace: true });
    } finally {
      setIsChangingContext(false);
    }
  };

  const switchToNormal = () => {
    setUiMode(UI_MODES.NORMAL);
    navigate('/');
  };

  const switchToEssential = () => {
    setUiMode(UI_MODES.ESSENTIAL);
    navigate('/essenziale');
  };

  const goToProject = (projectId) => {
    setMenuOpen(false);
    navigate(`/operativa/progetto/${projectId}`);
  };

  const goToSummary = () => {
    setMenuOpen(false);
    navigate('/operativa/riepilogo');
  };

  const goToCompanyWorkspace = () => {
    setMenuOpen(false);
    navigate('/operativa/societa');
  };

  const handleCompanyChangeFromMenu = async (company) => {
    await handleContextChange(company);
    setMenuOpen(false);
  };

  const selectedProjectId = location.pathname.startsWith('/operativa/progetto/')
    ? location.pathname.split('/')[3]
    : null;

  const showCompanyGuard = !isLoading && (currentContext !== 'company' || !currentCompany);

  return (
    <I18nextProvider i18n={i18next}>
      <div className="min-h-screen bg-gray-100">
        <header className="sticky top-0 z-40 bg-white border-b border-[#ef6144]/20">
          <div className="px-4 h-14 flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#ef6144] flex items-center justify-center">
                <HardHat className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('operationalMode.headerMode')}</p>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{currentCompany?.name || t('operationalMode.companyRequiredTitle')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {showCompanyGuard ? (
          <main className="max-w-md mx-auto px-4 py-4">
            <Card className="border-[#ef6144]/20">
              <CardContent className="p-4 space-y-3">
                <h1 className="text-lg font-semibold text-gray-900">{t('operationalMode.companyRequiredTitle')}</h1>
                <p className="text-sm text-gray-600">{t('operationalMode.companyRequiredDescription')}</p>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <Button
                      key={company.id}
                      className="w-full bg-[#ef6144] hover:bg-[#d9553a]"
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
          <main className="max-w-md mx-auto px-4 py-4 pb-24">
            <Outlet />
          </main>
        )}

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
            <div className="max-w-md mx-auto px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('operational.menuTitle')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <Card className="border-[#ef6144]/20">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">{t('operational.menuModes')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-[#ef6144]/30 text-[#ef6144]" onClick={switchToNormal}>
                      <Monitor className="h-4 w-4 mr-2" />
                      {t('operationalMode.fullModeLabel')}
                    </Button>
                    <Button variant="outline" className="border-[#ef6144]/30 text-[#ef6144]" onClick={switchToEssential}>
                      <HardHat className="h-4 w-4 mr-2" />
                      {t('operationalMode.essentialModeLabel')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#ef6144]/20">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">{t('settings.language')}</h3>
                  <LanguageSelector />
                  <Button variant="outline" className="w-full border-[#ef6144]/30 text-[#ef6144]" onClick={goToCompanyWorkspace}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Società
                  </Button>
                </CardContent>
              </Card>

              {companies.length > 1 && (
                <Card className="border-[#ef6144]/20">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">{t('operational.changeCompany')}</h3>
                    {companies.map((company) => (
                      <Button
                        key={company.id}
                        variant={currentCompany?.id === company.id ? 'default' : 'outline'}
                        className={currentCompany?.id === company.id ? 'w-full bg-[#ef6144] hover:bg-[#d9553a]' : 'w-full border-[#ef6144]/30 text-[#ef6144]'}
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
                <Card className="border-[#ef6144]/20">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">{t('operational.changeProject')}</h3>
                    <Button variant="outline" className="w-full border-[#ef6144]/30 text-[#ef6144]" onClick={goToSummary}>
                      {t('operational.daySummary')}
                    </Button>
                    {contextProjects.map((project) => (
                      <Button
                        key={project.id}
                        variant={selectedProjectId === project.id ? 'default' : 'outline'}
                        className={selectedProjectId === project.id ? 'w-full bg-[#ef6144] hover:bg-[#d9553a]' : 'w-full border-[#ef6144]/30 text-[#ef6144]'}
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
