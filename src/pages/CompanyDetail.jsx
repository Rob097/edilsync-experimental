import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import TourLauncher from '@/components/tour/TourLauncher';
import { getCompanyTour } from '@/components/tour/tours/companyTour';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Settings,
  Activity,
  Clock3,
  MessageSquare,
  FileText,
  Plus,
  CreditCard,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import MemberCard from '@/components/company/MemberCard';
import EditCompanyDialog from '@/components/company/EditCompanyDialog';
import CompanyTimeTrackingSection from '@/components/company/CompanyTimeTrackingSection';
import CompanyBillingSection from '@/components/company/CompanyBillingSection';
import ProjectMessaging from '@/components/messaging/ProjectMessaging';
import DocumentList from '@/components/project/DocumentList';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import FeatureGateCard from '@/components/ui/FeatureGateCard';
import { isFeatureAccessible, isFeatureFullyEnabled, useCompanyFeatureAccess } from '@/hooks/useFeatureAccess';

export default function CompanyDetail() {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');
  const initialTab = urlParams.get('tab');
  const initialSection = urlParams.get('section');

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'panoramica');
  const [operativaSection, setOperativaSection] = useState(initialTab === 'operativita' && initialSection ? initialSection : 'timbrature');
  const [infoSection, setInfoSection] = useState(initialTab === 'info' && initialSection ? initialSection : 'all');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await appClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['companyMembers', companyId],
    queryFn: () => appClient.entities.CompanyMember.filter({ company_id: companyId }),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { featureMap: companyFeatureMap } = useCompanyFeatureAccess(companyId, [
    'company_time_tracking',
    'company_chat',
    'company_documents',
  ], { enabled: !!companyId });

  const companyTimeTrackingFeatureAccess = companyFeatureMap.company_time_tracking;
  const companyChatFeatureAccess = companyFeatureMap.company_chat;
  const companyDocumentsFeatureAccess = companyFeatureMap.company_documents;
  const canUseCompanyTimeTracking = isFeatureAccessible(companyTimeTrackingFeatureAccess);
  const canCreateCompanyChannels = isFeatureFullyEnabled(companyChatFeatureAccess);
  const companyChatAccessMode = isFeatureFullyEnabled(companyChatFeatureAccess) ? 'full' : 'general_only';

  const { data: workSessions = [] } = useQuery({
    queryKey: ['workSessions', companyId],
    queryFn: () => appClient.entities.WorkSession.filter({ company_id: companyId }),
    enabled: !!companyId && canUseCompanyTimeTracking,
    staleTime: 30 * 1000,
  });

  const currentUserMembership = members.find((member) => member.user_email === user?.email);
  const isAdmin = currentUserMembership?.role === 'admin';

  React.useEffect(() => {
    if (activeTab === 'billing' && !isAdmin) {
      setActiveTab('panoramica');
    }
  }, [activeTab, isAdmin]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );
  const invitedMembers = useMemo(
    () => members.filter((member) => member.status === 'invited'),
    [members],
  );
  const openSessions = useMemo(
    () => workSessions.filter((session) => !session.ended_at),
    [workSessions],
  );
  const companyChatParticipants = useMemo(
    () => activeMembers.map((member) => ({
      id: member.id,
      user_email: member.user_email,
      company_id: companyId,
      status: member.status,
      user_display_name: getUserDisplayNameByEmail(member.user_email, allUsers),
    })),
    [activeMembers, companyId, allUsers],
  );

  const shouldStartCompanyTour = user
    && company
    && currentUserMembership?.status === 'active'
    && !user.tour_state?.companies_completed
    && !user.tour_state?.companies_dismissed;

  if (userLoading || companyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !company) {
    return (
      <EmptyState
        icon={Building2}
        title={t('companyDetail.companyNotFound')}
        description={t('companyDetail.companyNotFoundDescription')}
        actionLabel={t('companyDetail.backToCompanies')}
        onAction={() => navigate(createPageUrl('Companies'))}
      />
    );
  }

  const currentContext = user?.active_context || 'personal';
  const isViewingActiveCompany = currentContext === 'company' && user?.active_company_id === companyId;

  const navigateToSection = (tab, section = null) => {
    setActiveTab(tab);
    if (tab === 'operativita' && section) setOperativaSection(section);
    if (tab === 'info' && section) setInfoSection(section);

    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (!tabsElement) return;
      const offset = 100;
      const elementPosition = tabsElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <TourLauncher
        tourId="companies"
        steps={getCompanyTour(currentLanguage).steps}
        trigger={shouldStartCompanyTour}
        delay={1000}
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {!isViewingActiveCompany && (
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('Companies'))}
              className="mb-2 -ml-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.companies')}
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#ef6144]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-[#ef6144]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{company.name}</h1>
              {company.vat_number && (
                <p className="text-gray-500 break-words">P.IVA: {company.vat_number}</p>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="w-full sm:w-auto">
            <Settings className="h-4 w-4 mr-2" />
            {t('companyDetail.edit')}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {company.address && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('companyDetail.address')}</p>
                    <p className="font-medium">{company.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {company.phone && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('companyDetail.phone')}</p>
                    <p className="font-medium">{company.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {company.email && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('companyDetail.email')}</p>
                    <p className="font-medium">{company.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {company.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-gray-600">{company.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t" />

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setTimeout(() => {
          const tabsElement = document.querySelector('[role="tablist"]');
          if (!tabsElement) return;
          const offset = 100;
          const elementPosition = tabsElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }, 100);
      }}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="panoramica" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {tr('Panoramica', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="operativita" className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {tr('Operatività', 'Operations')}
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {tr('Info', 'Info')}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {tr('Fatturazione', 'Billing')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="panoramica" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{tr('Membri attivi', 'Active members')}</p>
                <p className="text-2xl font-bold mt-1">{activeMembers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{tr('Inviti pendenti', 'Pending invites')}</p>
                <p className="text-2xl font-bold mt-1">{invitedMembers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{tr('Timbrature aperte', 'Open sessions')}</p>
                <p className="text-2xl font-bold mt-1">{canUseCompanyTimeTracking ? openSessions.length : 'Premium'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tr('Azioni rapide', 'Quick actions')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigateToSection('operativita', 'timbrature')}>
                <Clock3 className="h-4 w-4 mr-2" />
                {tr('Apri timbrature', 'Open time tracking')}
              </Button>
              <Button variant="outline" onClick={() => navigateToSection('operativita', 'chat')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {tr('Apri chat interna', 'Open internal chat')}
              </Button>
              <Button variant="outline" onClick={() => navigateToSection('info', 'documenti')}>
                <FileText className="h-4 w-4 mr-2" />
                {tr('Apri documenti', 'Open documents')}
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {tr('Invita membro', 'Invite member')}
                </Button>
              )}
              {isAdmin && (
                <Button variant="outline" onClick={() => navigateToSection('billing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {tr('Apri fatturazione', 'Open billing')}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operativita" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <p className="font-medium text-gray-800">{tr('Area operativa società', 'Company operations area')}</p>
                <p className="text-gray-500">{tr('Timbrature aperte', 'Open sessions')}: <span className="font-semibold text-gray-700">{openSessions.length}</span></p>
                <p className="text-gray-500">{tr('Membri attivi', 'Active members')}: <span className="font-semibold text-gray-700">{activeMembers.length}</span></p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={operativaSection === 'all' ? 'default' : 'outline'}
              onClick={() => navigateToSection('operativita', 'all')}
              className={operativaSection === 'all' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Vista completa', 'Full view')}
            </Button>
            <Button
              variant={operativaSection === 'timbrature' ? 'default' : 'outline'}
              onClick={() => navigateToSection('operativita', 'timbrature')}
              className={operativaSection === 'timbrature' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Timbrature e presenze', 'Time tracking')}
            </Button>
            <Button
              variant={operativaSection === 'chat' ? 'default' : 'outline'}
              onClick={() => navigateToSection('operativita', 'chat')}
              className={operativaSection === 'chat' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Chat interna', 'Internal chat')}
            </Button>
          </div>

          {(operativaSection === 'all' || operativaSection === 'timbrature') && (
            <div id="section-timbrature">
              {canUseCompanyTimeTracking ? (
                <CompanyTimeTrackingSection
                  companyId={companyId}
                  companyName={company.name}
                  currentUser={user}
                  isAdmin={isAdmin}
                  mode="normal"
                />
              ) : (
                <FeatureGateCard
                  title={tr('Timbrature premium', 'Premium time tracking')}
                  description={tr(
                    'Le timbrature societarie fanno parte delle feature premium della società. In piano free la sezione resta visibile ma bloccata.',
                    'Company time tracking is part of the company premium features. On the free plan the section stays visible but locked.',
                  )}
                  badgeLabel={tr('Società paid', 'Paid company')}
                />
              )}
            </div>
          )}

          {(operativaSection === 'all' || operativaSection === 'chat') && (
            <div id="section-chat-operativita" className={operativaSection === 'all' ? 'border-t pt-4' : ''}>
              <h3 className="text-lg font-semibold mb-3">{tr('Chat interna società', 'Company internal chat')}</h3>
              <ProjectMessaging
                companyId={companyId}
                companyName={company.name}
                currentUser={user}
                activeCompanyId={companyId}
                participants={companyChatParticipants}
                canCreateChannels={isAdmin && canCreateCompanyChannels}
                channelAccessMode={companyChatAccessMode}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={infoSection === 'all' ? 'default' : 'outline'}
              onClick={() => navigateToSection('info', 'all')}
              className={infoSection === 'all' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Vedi tutto', 'View all')}
            </Button>
            <Button
              variant={infoSection === 'documenti' ? 'default' : 'outline'}
              onClick={() => navigateToSection('info', 'documenti')}
              className={infoSection === 'documenti' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Documenti', 'Documents')}
            </Button>
            <Button
              variant={infoSection === 'membri' ? 'default' : 'outline'}
              onClick={() => navigateToSection('info', 'membri')}
              className={infoSection === 'membri' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              {tr('Membri e inviti', 'Members and invites')}
            </Button>
          </div>

          {(infoSection === 'all' || infoSection === 'documenti') && (
            <div id="section-documenti" className="rounded-lg border bg-white p-4">
              <h3 className="text-lg font-semibold mb-3">{tr('Documenti società', 'Company documents')}</h3>
              <DocumentList
                companyId={companyId}
                scopeType="company"
                canUpload={currentUserMembership?.status === 'active'}
                currentUserEmail={user?.email}
                featureAccess={companyDocumentsFeatureAccess}
              />
            </div>
          )}

          {(infoSection === 'all' || infoSection === 'membri') && (
            <Card data-tour="company-members">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">{t('companyDetail.members')}</CardTitle>
                {isAdmin && (
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    className="bg-[#ef6144] hover:bg-[#d9553a]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('companyDetail.invite')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
                  </div>
                ) : activeMembers.length > 0 ? (
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        displayName={getUserDisplayNameByEmail(member.user_email, allUsers)}
                        isCurrentUser={member.user_email === user?.email}
                        isAdmin={isAdmin}
                        companyId={companyId}
                        canRemoveSelf={false}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title={t('companyDetail.noMembers')}
                    description={t('companyDetail.inviteMembersDescription')}
                  />
                )}

                {invitedMembers.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('companyDetail.pendingConfirmation')}</h4>
                    <div className="space-y-3">
                      {invitedMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          displayName={getUserDisplayNameByEmail(member.user_email, allUsers)}
                          isPending
                          isAdmin={isAdmin}
                          companyId={companyId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {isAdmin && (
          <TabsContent value="billing" className="space-y-6">
            <CompanyBillingSection
              companyId={companyId}
              companyName={company.name}
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}
      </Tabs>

      <button
        onClick={() => setQuickActionOpen((prev) => !prev)}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
      >
        <Plus className={`h-6 w-6 transition-transform ${quickActionOpen ? 'rotate-45' : ''}`} />
      </button>

      {quickActionOpen && (
        <div className="fixed bottom-24 right-24 bg-white rounded-lg shadow-xl border p-2 z-50 min-w-[220px]">
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('operativita', 'timbrature');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <Clock3 className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{tr('Apri timbrature', 'Open time tracking')}</span>
          </button>
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('operativita', 'chat');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{tr('Apri chat interna', 'Open internal chat')}</span>
          </button>
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('info', 'documenti');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <FileText className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{tr('Apri documenti', 'Open documents')}</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setQuickActionOpen(false);
                navigateToSection('billing');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
            >
              <CreditCard className="h-5 w-5 text-gray-700" />
              <span className="font-medium">{tr('Apri fatturazione', 'Open billing')}</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setQuickActionOpen(false);
                setInviteDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
            >
              <UserPlus className="h-5 w-5 text-gray-700" />
              <span className="font-medium">{tr('Invita membro', 'Invite member')}</span>
            </button>
          )}
        </div>
      )}

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        companyId={companyId}
      />

      <EditCompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
      />
    </div>
  );
}
