import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOperativeData } from '@/operativa/useOperativeData';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Briefcase, CalendarClock, Building2 } from 'lucide-react';

export default function OperativeEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const {
    companies,
    currentCompany,
    contextProjects,
    isLoading,
  } = useOperativeData();

  useEffect(() => {
    if (isLoading) return;
    if (!currentCompany) return;
    if (contextProjects.length === 1) {
      navigate(`/app/operativa/progetto/${contextProjects[0].id}`, { replace: true });
    }
  }, [isLoading, currentCompany, contextProjects, navigate]);

  const handleCompanyChange = async (company) => {
    await appClient.auth.updateMe({
      active_context: 'company',
      active_company_id: company.id,
    });

    await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
    await queryClient.invalidateQueries({ queryKey: ['operativeProjects'] });
  };

  if (isLoading) {
    return <div className="text-sm text-gray-600">{t('common.loading')}</div>;
  }

  return (
    <div className="operative-shell space-y-4 rounded-[1.5rem] pb-2">
      {companies.length > 1 ? (
        <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
          <CardHeader>
            <CardTitle className="text-base text-[#231b18]">{t('operational.selectCompany')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {companies.map((company) => (
              <Button
                key={company.id}
                variant={currentCompany?.id === company.id ? 'default' : 'outline'}
                className="operative-quick-button w-full"
                onClick={() => handleCompanyChange(company)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {company.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
        <CardHeader>
          <CardTitle className="text-base text-[#231b18]">{t('operational.chooseStart')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="operative-quick-button w-full"
            onClick={() => navigate('/app/operativa/riepilogo')}
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            {t('operational.daySummary')}
          </Button>
          <Button
            variant="outline"
            className="operative-quick-button w-full"
            onClick={() => navigate('/app/operativa/societa')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Società
          </Button>
        </CardContent>
      </Card>

      <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
        <CardHeader>
          <CardTitle className="text-base text-[#231b18]">{t('operational.selectProject')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contextProjects.length > 0 ? (
            contextProjects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="operative-quick-button w-full"
                onClick={() => navigate(`/app/operativa/progetto/${project.id}`)}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                {project.name}
              </Button>
            ))
          ) : (
            <p className="text-sm text-[#6d5c55]">{t('operational.noProjects')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
