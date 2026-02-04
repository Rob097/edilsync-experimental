import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Plus,
  Building2,
  User,
  Settings,
  MoreVertical,
  UserPlus,
  FileText,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import InviteParticipantDialog from '@/components/project/InviteParticipantDialog';
import ParticipantCard from '@/components/project/ParticipantCard';
import DocumentList from '@/components/project/DocumentList';
import ActivityFeed from '@/components/project/ActivityFeed';
import TaskList from '@/components/project/TaskList';
import ChangeRequestList from '@/components/project/ChangeRequestList';
import ProjectChat from '@/components/project/ProjectChat';
import EmptyState from '@/components/ui/EmptyState';

const statusConfig = {
  planning: { label: 'Pianificazione', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In corso', color: 'bg-[#ef6144]/10 text-[#ef6144]' },
  completed: { label: 'Completato', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'In pausa', color: 'bg-yellow-100 text-yellow-700' },
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['participantCompanies', participants],
    queryFn: async () => {
      const companyIds = participants.filter(p => p.company_id).map(p => p.company_id);
      if (companyIds.length === 0) return [];
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: participants.length > 0,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  // Check user's role in this project
  const userParticipation = participants.find(p => {
    if (p.participant_type === 'personal' && p.user_id === user?.id) return true;
    if (p.participant_type === 'company') {
      const userCompanyIds = companyMemberships.map(m => m.company_id);
      return userCompanyIds.includes(p.company_id);
    }
    return false;
  });

  const canInvite = userParticipation?.can_invite || userParticipation?.project_role === 'homeowner';
  const canEditTasks = !!userParticipation;
  const canCreateChangeRequest = !!userParticipation;
  const canRespondToChangeRequest = userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id;

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Società';
  };

  const activeParticipants = participants.filter(p => p.status === 'active');
  const invitedParticipants = participants.filter(p => p.status === 'invited');

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={Settings}
        title="Progetto non trovato"
        description="Il progetto richiesto non esiste o non hai i permessi per visualizzarlo."
        actionLabel="Torna ai progetti"
        onAction={() => navigate(createPageUrl('Projects'))}
      />
    );
  }

  const status = statusConfig[project.status] || statusConfig.planning;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Projects'))}
            className="mb-2 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Progetti
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{project.address}</span>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#ef6144]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeParticipants.length}</p>
                <p className="text-sm text-gray-500">Partecipanti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {project.start_date && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {format(new Date(project.start_date), 'd MMM yyyy', { locale: it })}
                  </p>
                  <p className="text-sm text-gray-500">Data inizio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {project.end_date && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {format(new Date(project.end_date), 'd MMM yyyy', { locale: it })}
                  </p>
                  <p className="text-sm text-gray-500">Data fine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Attività
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Task
          </TabsTrigger>
          <TabsTrigger value="changes" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Modifiche
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partecipanti
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <ActivityFeed projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskList projectId={projectId} canEdit={canEditTasks} />
        </TabsContent>

        <TabsContent value="changes">
          <ChangeRequestList 
            projectId={projectId} 
            canCreate={canCreateChangeRequest}
            canRespond={canRespondToChangeRequest}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={projectId} />
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Partecipanti</CardTitle>
              {canInvite && (
                <Button 
                  onClick={() => setInviteDialogOpen(true)}
                  className="bg-[#ef6144] hover:bg-[#d9553a]"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invita
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {participantsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : activeParticipants.length > 0 ? (
                <div className="space-y-3">
                  {activeParticipants.map(participant => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      companyName={participant.company_id ? getCompanyName(participant.company_id) : null}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nessun partecipante"
                  description="Invita contractor, progettisti e altri professionisti."
                />
              )}

              {invitedParticipants.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">In attesa di conferma</h4>
                  <div className="space-y-3">
                    {invitedParticipants.map(participant => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        companyName={participant.company_id ? getCompanyName(participant.company_id) : null}
                        isPending
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentList 
            projectId={projectId}
            canUpload={!!userParticipation}
            currentUserEmail={user?.email}
          />
        </TabsContent>
      </Tabs>

      <InviteParticipantDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={projectId}
        currentUserParticipation={userParticipation}
      />
    </div>
  );
}