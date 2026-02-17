import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton.jsx";
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
  Activity,
  Flag,
  Camera,
  Upload,
  AlertCircle,
  Clock
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
import ProjectMessaging from '@/components/messaging/ProjectMessaging';
import EmptyState from '@/components/ui/EmptyState';
import EditProjectDialog from '@/components/project/EditProjectDialog';
import MilestoneList from '@/components/project/MilestoneList';
import ProjectOverview from '@/components/project/ProjectOverview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('cantiere');
  const [lavoriSection, setLavoriSection] = useState('all');
  const [infoSection, setInfoSection] = useState('all');
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [changeCreateOpen, setChangeCreateOpen] = useState(false);
  const [taskFilterMilestoneId, setTaskFilterMilestoneId] = useState(null);

  const acceptInviteMutation = useMutation({
    mutationFn: async (participantId) => {
      // Step 1: Accept the invitation
      await base44.entities.ProjectParticipant.update(participantId, { status: 'active' });
      
      // Step 2: Sync user access (updates project_ids on user entity)
      await base44.functions.invoke('syncUserAccess', { user_email: user.email });
      
      // Step 3: Add to General channel
      const participant = participants.find(p => p.id === participantId);
      if (participant) {
        const channels = await base44.entities.Channel.filter({ 
          project_id: projectId, 
          type: 'general'
        });
        if (channels.length > 0) {
          await base44.entities.ChannelMember.create({
            channel_id: channels[0].id,
            project_id: projectId,
            participant_id: participant.id,
            user_email: participant.user_email || null,
            company_id: participant.company_id || null,
            last_read_at: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      // Stagger invalidations to avoid 429
      queryClient.invalidateQueries({ queryKey: ['projectParticipants', projectId] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }, 500);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['userProjectParticipations'] });
      }, 1000);
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: (participantId) => base44.entities.ProjectParticipant.update(participantId, { status: 'declined' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectParticipants', projectId]);
      queryClient.invalidateQueries(['userProjectParticipations']);
      navigate(createPageUrl('Projects'));
    },
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId && !!project,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    staleTime: 5 * 60 * 1000,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  // Find ALL participations for this user (personal + company)
  const userCompanyIds = companyMemberships.map(m => m.company_id);
  const allUserParticipations = participants.filter(p => {
    if (p.participant_type === 'personal' && p.user_id === user?.id) return true;
    if (p.participant_type === 'company' && userCompanyIds.includes(p.company_id)) return true;
    return false;
  });

  // Context-aware participation: pick the one matching current context
  const currentContext = user?.active_context || 'personal';
  const contextParticipation = allUserParticipations.find(p => {
    if (currentContext === 'personal') return p.participant_type === 'personal';
    if (currentContext === 'company') return p.participant_type === 'company' && p.company_id === user?.active_company_id;
    return false;
  });

  // Fallback: if no match for current context, use any active participation
  const userParticipation = contextParticipation || allUserParticipations.find(p => p.status === 'active') || allUserParticipations[0];

  // Is the CURRENT CONTEXT participation active? This controls what content is shown
  const isActiveParticipant = contextParticipation?.status === 'active';
  
  const canInvite = isActiveParticipant && (userParticipation?.can_invite || userParticipation?.project_role === 'homeowner');
  const canEditTasks = isActiveParticipant;
  const canCreateChangeRequest = isActiveParticipant && (userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id);
  const canRespondToChangeRequest = isActiveParticipant && (userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id);
  const canRemoveParticipants = isActiveParticipant && (userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id || canInvite);

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Società';
  };

  const activeParticipants = participants.filter(p => p.status === 'active');
  const invitedParticipants = participants.filter(p => p.status === 'invited');

  // Get blocked tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && !!project,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');

  // Navigation helper
  const navigateToSection = (tab, section = null, itemId = null) => {
    setActiveTab(tab);
    if (tab === 'lavori' && section) {
      setLavoriSection(section);
    }
    if (tab === 'info' && section) {
      setInfoSection(section);
    }
    
    // Scroll to tabs level after state update
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        const offset = 100;
        const elementPosition = tabsElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      
      // Then scroll to specific item if provided
      if (itemId) {
        setTimeout(() => {
          const element = document.getElementById(itemId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }, 100);
  };

  if (userLoading || projectLoading || (!!projectId && !project)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !project) {
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

  // Show invite banner only if the context-specific participation is "invited"
  const isInvited = contextParticipation && contextParticipation.status === 'invited';

  return (
    <div className="space-y-6">
      {/* Invitation Banner */}
      {isInvited && (
        <Card className="border-[#ef6144] bg-[#ef6144]/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Sei stato invitato a questo progetto</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Accetta l'invito per partecipare alle attività del cantiere
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => declineInviteMutation.mutate(userParticipation.id)}
                  disabled={declineInviteMutation.isPending}
                >
                  Rifiuta
                </Button>
                <Button 
                  className="bg-[#ef6144] hover:bg-[#d9553a]"
                  onClick={() => acceptInviteMutation.mutate(userParticipation.id)}
                  disabled={acceptInviteMutation.isPending}
                >
                  Accetta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Projects'))}
            className="mb-2 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Progetti
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">{project.address}</span>
            </div>
            <Badge className={`${status.color} w-fit`}>{status.label}</Badge>
          </div>
        </div>
        {isActiveParticipant && project.owner_user_id === user?.id && (
          <Button
            variant="outline"
            onClick={() => setEditProjectDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        )}
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

      {/* Blocked Banner */}
      {isActiveParticipant && blockedTasks.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Cantiere Fermo</h3>
                <p className="text-sm text-red-700 mt-1">
                  {blockedTasks.length === 1 
                    ? `1 attività bloccata` 
                    : `${blockedTasks.length} attività bloccate`}
                  {blockedTasks[0]?.blocked_by_name && ` • In attesa di ${blockedTasks[0].blocked_by_name}`}
                </p>
                <Button
                  variant="link"
                  className="text-red-700 hover:text-red-900 p-0 h-auto mt-1"
                  onClick={() => setActiveTab('lavori')}
                >
                  Vedi dettagli →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      {isActiveParticipant && <div className="border-t" />}

      {/* Tabs - only for active participants */}
      {!isActiveParticipant ? null :
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setTimeout(() => {
          const tabsElement = document.querySelector('[role="tablist"]');
          if (tabsElement) {
            const offset = 100;
            const elementPosition = tabsElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 100);
      }}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="cantiere" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Cantiere
          </TabsTrigger>
          <TabsTrigger value="lavori" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Lavori
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Info & Team
          </TabsTrigger>
        </TabsList>

        {/* CANTIERE TAB - Panoramica e Feed */}
        <TabsContent value="cantiere" className="space-y-6">
          <ProjectOverview 
            projectId={projectId}
            onNavigate={navigateToSection}
          />
          
          <ActivityFeed 
            projectId={projectId} 
            onItemClick={(type, itemId) => {
              if (type === 'photo') {
                navigateToSection('info', 'documents', `doc-${itemId}`);
              } else if (type === 'change_request') {
                navigateToSection('lavori', 'changes', `change-${itemId}`);
              } else if (type === 'task') {
                navigateToSection('lavori', 'tasks', `task-${itemId}`);
              } else if (type === 'milestone') {
                navigateToSection('lavori', 'milestones', `milestone-${itemId}`);
              } else if (type === 'message') {
                navigateToSection('info', 'chat');
              }
            }}
          />
        </TabsContent>

        {/* LAVORI TAB - Task e Change Requests */}
        <TabsContent value="lavori" className="space-y-6">
          {/* Section selector */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={lavoriSection === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setLavoriSection('all');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={lavoriSection === 'all' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Vedi Tutto
            </Button>
            <Button
              variant={lavoriSection === 'tasks' ? 'default' : 'outline'}
              onClick={() => {
                setLavoriSection('tasks');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={lavoriSection === 'tasks' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Attività
            </Button>
            <Button
              variant={lavoriSection === 'changes' ? 'default' : 'outline'}
              onClick={() => {
                setLavoriSection('changes');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={lavoriSection === 'changes' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Modifiche & Extra
            </Button>
            <Button
              variant={lavoriSection === 'milestones' ? 'default' : 'outline'}
              onClick={() => {
                setLavoriSection('milestones');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={lavoriSection === 'milestones' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Milestones
            </Button>
          </div>

          {/* Tasks section */}
          {(lavoriSection === 'all' || lavoriSection === 'tasks') && (
            <div id="section-tasks">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Attività in Corso</h3>
              </div>
              <TaskList 
                projectId={projectId} 
                canEdit={canEditTasks} 
                filterMilestoneId={taskFilterMilestoneId}
              />
            </div>
          )}
          
          {/* Changes section */}
          {(lavoriSection === 'all' || lavoriSection === 'changes') && (
            <div id="section-changes" className={lavoriSection === 'all' ? 'border-t pt-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Modifiche & Extra</h3>
              </div>
              <ChangeRequestList 
                projectId={projectId} 
                canCreate={canCreateChangeRequest}
                canRespond={canRespondToChangeRequest}
                createDialogOpen={changeCreateOpen}
                onCreateDialogChange={setChangeCreateOpen}
                currentUserEmail={user?.email}
              />
            </div>
          )}

          {/* Milestones section */}
          {(lavoriSection === 'all' || lavoriSection === 'milestones') && (
            <div id="section-milestones" className={lavoriSection === 'all' ? 'border-t pt-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
              </div>
              <MilestoneList 
                projectId={projectId}
                project={project}
                canEdit={canEditTasks}
                onNavigateToTasks={(milestoneId) => {
                  setTaskFilterMilestoneId(milestoneId);
                  setActiveTab('lavori');
                  setLavoriSection('tasks');
                  setTimeout(() => {
                    const tasksSection = document.getElementById('section-tasks');
                    if (tasksSection) {
                      tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              />
            </div>
          )}
        </TabsContent>

        {/* Info & TEAM TAB */}
        <TabsContent value="info" className="space-y-6">
          {/* Section selector */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={infoSection === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setInfoSection('all');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={infoSection === 'all' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Vedi Tutto
            </Button>
            <Button
              variant={infoSection === 'chat' ? 'default' : 'outline'}
              onClick={() => {
                setInfoSection('chat');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={infoSection === 'chat' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Chat
            </Button>
            <Button
              variant={infoSection === 'participants' ? 'default' : 'outline'}
              onClick={() => {
                setInfoSection('participants');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={infoSection === 'participants' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Partecipanti
            </Button>
            <Button
              variant={infoSection === 'documents' ? 'default' : 'outline'}
              onClick={() => {
                setInfoSection('documents');
                setTimeout(() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={infoSection === 'documents' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
            >
              Documenti
            </Button>
          </div>

          {/* Chat Section */}
          {(infoSection === 'all' || infoSection === 'chat') && (
            <div id="section-chat">
              <h3 className="text-lg font-semibold mb-4">Messaggistica</h3>
              <ProjectMessaging
                projectId={projectId}
                currentUser={user}
                activeCompanyId={user?.active_company_id}
                participants={activeParticipants}
                onNavigate={(type, id) => {
                  if (type === 'task') {
                    navigateToSection('lavori', 'tasks', `task-${id}`);
                  } else if (type === 'milestone') {
                    navigateToSection('lavori', 'milestones', `milestone-${id}`);
                  } else if (type === 'change_request') {
                    navigateToSection('lavori', 'changes', `change-${id}`);
                  }
                }}
              />
            </div>
          )}

          {/* Participants Section */}
          {(infoSection === 'all' || infoSection === 'participants') && (
            <Card id="section-participants">
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
                        canRemove={canRemoveParticipants && participant.id !== userParticipation?.id && participant.project_role !== 'homeowner'}
                        projectId={projectId}
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
                          canRemove={canRemoveParticipants}
                          projectId={projectId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          {(infoSection === 'all' || infoSection === 'documents') && (
            <Card id="section-documents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList 
                  projectId={projectId}
                  canUpload={isActiveParticipant}
                  currentUserEmail={user?.email}
                  uploadDialogOpen={documentUploadOpen}
                  onUploadDialogChange={setDocumentUploadOpen}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      }



      <InviteParticipantDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={projectId}
        currentUserParticipation={userParticipation}
      />

      <EditProjectDialog
        open={editProjectDialogOpen}
        onOpenChange={setEditProjectDialogOpen}
        project={project}
      />
    </div>
  );
}