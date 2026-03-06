import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock3, Users, MessageSquare, FileText } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { useEssentialData } from '@/essential/useEssentialData';
import CompanyTimeTrackingSection from '@/components/company/CompanyTimeTrackingSection';
import ProjectMessaging from '@/components/messaging/ProjectMessaging';
import DocumentList from '@/components/project/DocumentList';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

export default function EssentialCompanyDetail() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const [activeSection, setActiveSection] = useState('timbrature');
  const { user } = useEssentialData();

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await appClient.entities.Company.filter({ id: companyId });
      return companies[0] || null;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['companyMembers', companyId],
    queryFn: () => appClient.entities.CompanyMember.filter({ company_id: companyId }),
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const currentUserMembership = members.find((m) => m.user_email === user?.email);
  const isAdmin = currentUserMembership?.role === 'admin';
  const canUploadCompanyDocuments = currentUserMembership?.status === 'active';

  const companyChatParticipants = useMemo(
    () => members
      .filter((member) => member.status === 'active')
      .map((member) => ({
        id: member.id,
        user_email: member.user_email,
        company_id: companyId,
        status: member.status,
        user_display_name: getUserDisplayNameByEmail(member.user_email, allUsers),
      })),
    [members, companyId, allUsers],
  );

  if (!company) {
    return (
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-6 text-center text-gray-600">{tr('Società non trovata.', 'Company not found.')}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{company.name}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{tr('Membri attivi', 'Active members')}</p>
            <p className="text-xl font-semibold">{members.filter((m) => m.status === 'active').length}</p>
          </div>
          <Users className="h-5 w-5 text-[#ef6144]" />
        </CardContent>
      </Card>

      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#ef6144]" />
            {tr('Operazioni aziendali', 'Company operations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={activeSection === 'timbrature' ? 'default' : 'outline'}
              className={activeSection === 'timbrature' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
              onClick={() => setActiveSection('timbrature')}
            >
              <Clock3 className="h-4 w-4 mr-1" />
              {tr('Timbrature', 'Tracking')}
            </Button>
            <Button
              type="button"
              variant={activeSection === 'chat' ? 'default' : 'outline'}
              className={activeSection === 'chat' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
              onClick={() => setActiveSection('chat')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {tr('Chat', 'Chat')}
            </Button>
            <Button
              type="button"
              variant={activeSection === 'documenti' ? 'default' : 'outline'}
              className={activeSection === 'documenti' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
              onClick={() => setActiveSection('documenti')}
            >
              <FileText className="h-4 w-4 mr-1" />
              {tr('Documenti', 'Documents')}
            </Button>
          </div>

          {activeSection === 'timbrature' && (
            <CompanyTimeTrackingSection
              companyId={company.id}
              companyName={company.name}
              currentUser={user}
              isAdmin={isAdmin}
              mode="essential"
            />
          )}

          {activeSection === 'chat' && (
            <ProjectMessaging
              companyId={company.id}
              companyName={company.name}
              currentUser={user}
              activeCompanyId={company.id}
              participants={companyChatParticipants}
              canCreateChannels={isAdmin}
            />
          )}

          {activeSection === 'documenti' && (
            <DocumentList
              scopeType="company"
              companyId={company.id}
              canUpload={canUploadCompanyDocuments}
              currentUserEmail={user?.email}
            />
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10"
        onClick={() => navigate(`/CompanyDetail?id=${company.id}`)}
      >
        {tr('Apri dettagli completi', 'Open full details')}
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
