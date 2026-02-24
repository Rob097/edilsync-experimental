import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle2, Flag, FileText, ReceiptText, ArrowRight } from 'lucide-react';
import EditProjectDialog from '@/components/project/EditProjectDialog';
import { useEssentialData } from '@/essential/useEssentialData';
import EssentialTasksSection from '@/essential/project/EssentialTasksSection';
import EssentialMilestonesSection from '@/essential/project/EssentialMilestonesSection';
import EssentialDocumentsSection from '@/essential/project/EssentialDocumentsSection';
import EssentialChangeRequestsSection from '@/essential/project/EssentialChangeRequestsSection';
import ProjectMessaging from '@/components/messaging/ProjectMessaging';
import { useLanguage } from '@/components/i18n/useLanguage';

function SectionTile({ label, icon: Icon, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left"
    >
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[#ef6144]/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-[#ef6144]" />
            </div>
            <p className="text-xl font-semibold text-gray-900">{label}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-[#ef6144]" />
        </CardContent>
      </Card>
    </button>
  );
}

export default function EssentialProjectExplorer() {
  const navigate = useNavigate();
  const { projectId, section } = useParams();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);

  const SECTION_CONFIG = [
    { key: 'messaggi', label: tr('Messaggi', 'Messages'), icon: MessageSquare },
    { key: 'attivita', label: tr('Attività', 'Tasks'), icon: CheckCircle2 },
    { key: 'milestone', label: tr('Milestone', 'Milestones'), icon: Flag },
    { key: 'documenti', label: tr('Documenti', 'Documents'), icon: FileText },
    { key: 'richieste', label: tr('Richieste', 'Requests'), icon: ReceiptText },
  ];

  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);

  const {
    user,
    companyMemberships,
    currentContext,
  } = useEssentialData();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await appClient.entities.Project.filter({ id: projectId });
      return projects[0] || null;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const userCompanyIds = companyMemberships.map((membership) => membership.company_id);

  const contextParticipation = participants.find((participant) => {
    if (currentContext === 'personal') {
      return participant.participant_type === 'personal' && participant.user_id === user?.id;
    }
    return participant.participant_type === 'company' && participant.company_id === user?.active_company_id;
  });

  const userParticipation = contextParticipation
    || participants.find((participant) =>
      (participant.participant_type === 'personal' && participant.user_id === user?.id)
      || (participant.participant_type === 'company' && userCompanyIds.includes(participant.company_id)))
    || null;

  const isActiveParticipant = contextParticipation?.status === 'active';

  const canEditTasks = isActiveParticipant;
  const canCreateChangeRequest = isActiveParticipant
    && (userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id);
  const canRespondToChangeRequest = canCreateChangeRequest;

  if (!project) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">{tr('Progetto non trovato.', 'Project not found.')}</CardContent>
      </Card>
    );
  }

  if (!section) {
    return (
      <div className="space-y-5">
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{project.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{tr('Indirizzo', 'Address')}</p><p className="text-lg font-medium">{project.address}</p></CardContent></Card>
              {project.status ? <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{tr('Stato', 'Status')}</p><p className="text-lg font-medium">{project.status}</p></CardContent></Card> : null}
            </div>

            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => setEditProjectDialogOpen(true)}>{tr('Modifica informazioni progetto', 'Edit project info')}</Button>
            <Button variant="outline" className="w-full border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" onClick={() => navigate('/essenziale/progetti')}>{tr('Torna ai progetti', 'Back to projects')}</Button>
          </CardContent>
        </Card>

        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">{tr('Sezioni progetto', 'Project sections')}</CardTitle>
          </CardHeader>
        </Card>

        {SECTION_CONFIG.map((sectionConfig) => (
          <SectionTile
            key={sectionConfig.key}
            label={sectionConfig.label}
            icon={sectionConfig.icon}
            onOpen={() => navigate(`/essenziale/progetti/${projectId}/${sectionConfig.key}`)}
          />
        ))}

        <EditProjectDialog
          open={editProjectDialogOpen}
          onOpenChange={setEditProjectDialogOpen}
          project={project}
          canEdit={true}
        />
      </div>
    );
  }

  if (!isActiveParticipant) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">{tr('Nel contesto attuale non sei partecipante attivo del progetto.', 'In the current context you are not an active project participant.')}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{tr('Progetto', 'Project')}</p>
            <p className="text-lg font-semibold">{project.name}</p>
          </div>
        </CardContent>
      </Card>

      {section === 'messaggi' ? (
        <ProjectMessaging
          projectId={projectId}
          currentUser={user}
          activeCompanyId={currentContext === 'company' ? user?.active_company_id : null}
          participants={participants.filter((participant) => participant.status === 'active')}
        />
      ) : null}

      {section === 'attivita' ? (
        <EssentialTasksSection
          projectId={projectId}
          canEdit={canEditTasks}
          participants={participants}
          userParticipation={userParticipation}
        />
      ) : null}

      {section === 'milestone' ? (
        <EssentialMilestonesSection projectId={projectId} canEdit={canEditTasks} />
      ) : null}

      {section === 'documenti' ? (
        <EssentialDocumentsSection
          projectId={projectId}
          canUpload={isActiveParticipant}
          currentUser={user}
        />
      ) : null}

      {section === 'richieste' ? (
        <EssentialChangeRequestsSection
          projectId={projectId}
          canCreate={canCreateChangeRequest}
          canRespond={canRespondToChangeRequest}
          currentUser={user}
        />
      ) : null}
    </div>
  );
}
