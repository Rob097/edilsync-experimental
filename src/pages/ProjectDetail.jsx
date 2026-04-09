import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TourLauncher from '@/components/tour/TourLauncher';
import { getProjectTour } from '@/components/tour/tours/projectTour';
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
  Settings,
  UserPlus,
  FileText,
  CheckCircle2,
  DollarSign,
  BookOpen,
  Activity,
  ShieldAlert,
  Upload,
  AlertCircle
} from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';
import InviteParticipantDialog from '@/components/project/InviteParticipantDialog';
import ParticipantCard from '@/components/project/ParticipantCard';
import DocumentList from '@/components/project/DocumentList';
import ActivityFeed from '@/components/project/ActivityFeed';
import TaskList from '@/components/project/TaskList';
import ChangeRequestList from '@/components/project/ChangeRequestList';
import DisputeCaseList from '@/components/project/DisputeCaseList';
import ProjectMessaging from '@/components/messaging/ProjectMessaging';
import EmptyState from '@/components/ui/EmptyState';
import EditProjectDialog from '@/components/project/EditProjectDialog';
import MilestoneList from '@/components/project/MilestoneList';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectFinancialSection from '@/components/project/ProjectFinancialSection';
import ProjectSponsorshipCard from '@/components/project/ProjectSponsorshipCard';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import { getProjectFinancialPermissions } from '@/lib/financePermissions';
import { useTour } from '@/components/tour/TourProvider';
import { getFinanceSectionTour } from '@/components/tour/tours/financeTour';
import FeatureGateCard from '@/components/ui/FeatureGateCard';
import { isFeatureAccessible, isFeatureFullyEnabled, isProjectBlockedForSponsorLoss, useProjectFeatureAccess, useProjectPricingStatus } from '@/hooks/useFeatureAccess';

const statusConfig = {
  planning: { color: 'bg-blue-100 text-blue-700' },
  in_progress: { color: 'bg-[#ef6144]/10 text-[#ef6144]' },
  completed: { color: 'bg-green-100 text-green-700' },
  on_hold: { color: 'bg-yellow-100 text-yellow-700' },
};

export default function ProjectDetail() {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const { startTour } = useTour();
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(location.search);
  const projectId = urlParams.get('id');
  const initialTab = urlParams.get('tab');
  const initialSection = urlParams.get('section');
  const initialItemId = urlParams.get('itemId');
  const initialCreateAction = urlParams.get('create');
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'cantiere');
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [lavoriSection, setLavoriSection] = useState(initialTab === 'lavori' && initialSection ? initialSection : 'all');
  const [infoSection, setInfoSection] = useState(initialTab === 'info' && initialSection ? initialSection : 'all');
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [changeCreateOpen, setChangeCreateOpen] = useState(false);
  const [disputeCreateOpen, setDisputeCreateOpen] = useState(false);
  const [taskFilterMilestoneId, setTaskFilterMilestoneId] = useState(null);
  const [hasScrolledToItem, setHasScrolledToItem] = useState(false);

  useEffect(() => {
    if (!initialCreateAction) return;

    if (initialCreateAction === 'task') {
      setActiveTab('lavori');
      setLavoriSection('tasks');
      setTaskCreateOpen(true);
    }

    if (initialCreateAction === 'change') {
      setActiveTab('lavori');
      setLavoriSection('changes');
      setChangeCreateOpen(true);
    }

    if (initialCreateAction === 'dispute') {
      setActiveTab('lavori');
      setLavoriSection('disputes');
      setDisputeCreateOpen(true);
    }

    const nextParams = new URLSearchParams(location.search);
    nextParams.delete('create');
    const nextQuery = nextParams.toString();
    navigate(`${createPageUrl('ProjectDetail')}${nextQuery ? `?${nextQuery}` : ''}`, { replace: true });
  }, [initialCreateAction, location.search, navigate]);

  const acceptInviteMutation = useMutation({
    mutationFn: async (participantId) => {
      // Step 1: Accept the invitation
      await appClient.entities.ProjectParticipant.update(participantId, { status: 'active' });

      // Step 2: Add to General channel
      const participant = participants.find(p => p.id === participantId);
      if (participant) {
        const channels = await appClient.entities.Channel.filter({ 
          project_id: projectId, 
          type: 'general'
        });
        if (channels.length > 0) {
          await appClient.entities.ChannelMember.create({
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
    mutationFn: (participantId) => appClient.entities.ProjectParticipant.update(participantId, { status: 'declined' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectParticipants', projectId]);
      queryClient.invalidateQueries(['userProjectParticipations']);
      navigate(createPageUrl('Projects'));
    },
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await appClient.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId && !!project,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['participantCompanies', participants],
    queryFn: async () => {
      const companyIds = participants.filter(p => p.company_id).map(p => p.company_id);
      if (companyIds.length === 0) return [];
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: participants.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
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
  const canManageDisputes = isActiveParticipant;
  const canRemoveParticipants = isActiveParticipant && (userParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id || canInvite);
  const currentCompanyMembership = user?.active_company_id
    ? companyMemberships.find((membership) => membership.company_id === user.active_company_id && membership.status === 'active')
    : null;
  const financialPermissions = getProjectFinancialPermissions({
    isActiveParticipant,
    participantType: userParticipation?.participant_type,
    projectRole: userParticipation?.project_role,
    companyRole: currentCompanyMembership?.role,
  });
  const { featureMap: projectFeatureMap } = useProjectFeatureAccess(projectId, [
    'project_milestones',
    'project_chat',
    'project_documents',
    'project_finance',
  ], { enabled: !!projectId && isActiveParticipant });
  const { projectPricingStatus } = useProjectPricingStatus(projectId, { enabled: !!projectId && isActiveParticipant });

  const milestonesFeatureAccess = projectFeatureMap.project_milestones;
  const projectChatFeatureAccess = projectFeatureMap.project_chat;
  const projectDocumentsFeatureAccess = projectFeatureMap.project_documents;
  const projectFinanceFeatureAccess = projectFeatureMap.project_finance;

  const canUseMilestones = isFeatureAccessible(milestonesFeatureAccess);
  const isBlockedProject = isProjectBlockedForSponsorLoss(projectPricingStatus);
  const showMilestonesPlanGate = isActiveParticipant && milestonesFeatureAccess?.access_level === 'disabled';
  const chatAccessMode = isFeatureFullyEnabled(projectChatFeatureAccess) ? 'full' : 'general_only';
  const canCreateProjectChannels = isFeatureFullyEnabled(projectChatFeatureAccess);
  const financeFeatureEnabled = isFeatureAccessible(projectFinanceFeatureAccess);
  const showFinancePlanGate = isActiveParticipant && projectFinanceFeatureAccess?.access_level === 'disabled';
  const canViewFinanceSection = financeFeatureEnabled && financialPermissions.canViewSection;
  const shouldShowFinanceButton = !isBlockedProject && (showFinancePlanGate || canViewFinanceSection);

  useEffect(() => {
    if (!isBlockedProject) return;
    if (activeTab !== 'info') {
      setActiveTab('info');
    }
    if (infoSection !== 'participants') {
      setInfoSection('participants');
    }
  }, [activeTab, infoSection, isBlockedProject]);

  useEffect(() => {
    if (infoSection === 'finance' && !shouldShowFinanceButton) {
      setInfoSection('all');
    }
  }, [infoSection, shouldShowFinanceButton]);

  // Start project tour when viewing project detail
  const shouldStartProjectTour = user && 
    project && 
    isActiveParticipant &&
    !user.tour_state?.projects_completed && 
    !user.tour_state?.projects_dismissed;

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Società';
  };

  const participantsWithNames = participants.map((participant) => {
    if (participant.participant_type !== 'personal') return participant;
    return {
      ...participant,
      user_display_name: getUserDisplayNameByEmail(participant.user_email, allUsers),
    };
  });

  const activeParticipants = participantsWithNames.filter(p => p.status === 'active');
  const invitedParticipants = participantsWithNames.filter(p => p.status === 'invited');

  // Get blocked tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && !!project,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');

  useEffect(() => {
    if (!initialItemId || hasScrolledToItem) return;
    if (activeTab !== 'lavori' || lavoriSection !== 'tasks') return;
    if (allTasks.length === 0) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(initialItemId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHasScrolledToItem(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [initialItemId, hasScrolledToItem, activeTab, lavoriSection, allTasks.length]);

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
        title={t('projectDetail.projectNotFound')}
        description={t('projectDetail.projectNotFoundDescription')}
        actionLabel={t('projectDetail.backToProjects')}
        onAction={() => navigate(createPageUrl('Projects'))}
      />
    );
  }

  const status = statusConfig[project.status] || statusConfig.planning;
  const statusLabel = project.status === 'on_hold'
    ? tr('In pausa', 'On hold')
    : t(`project.status.${project.status || 'planning'}`);

  // Show invite banner only if the context-specific participation is "invited"
  const isInvited = contextParticipation && contextParticipation.status === 'invited';

  return (
    <div className="space-y-6">
      {/* Launch project tour */}
      <TourLauncher 
        tourId="projects" 
        steps={getProjectTour(currentLanguage).steps} 
        trigger={shouldStartProjectTour}
        delay={1000}
      />

      {/* Invitation Banner */}
      {isInvited && (
        <Card className="app-panel border-[rgba(217,85,58,0.36)] bg-[rgba(239,97,68,0.08)]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold tracking-[-0.02em] text-[#231b18]">{t('projectDetail.youAreInvited')}</h3>
                <p className="mt-1 text-sm leading-6 text-[#6d5c55]">
                  {t('projectDetail.acceptInviteDescription')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => declineInviteMutation.mutate(userParticipation.id)}
                  disabled={declineInviteMutation.isPending}
                >
                  {t('projectDetail.decline')}
                </Button>
                <Button 
                  onClick={() => acceptInviteMutation.mutate(userParticipation.id)}
                  disabled={acceptInviteMutation.isPending}
                >
                  {t('projectDetail.accept')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="app-page-header min-w-0 flex-1">
          <span className="app-page-kicker">{t('projectDetail.kicker')}</span>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Projects'))}
            className="-ml-3 mb-1 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.projects')}
          </Button>
          <h1 className="app-page-title">{project.name}</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-1.5 text-[#6d5c55]">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">{project.address}</span>
            </div>
            <Badge className={`${status.color} w-fit`}>{statusLabel}</Badge>
          </div>
        </div>
        {isActiveParticipant && project.owner_user_id === user?.id && (
          <Button
            variant="outline"
            onClick={() => setEditProjectDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('projectDetail.edit')}
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="app-kpi-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
               <div className="app-kpi-icon app-kpi-icon--accent">
                 <Users className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-2xl font-bold tracking-[-0.03em] text-[#231b18]">{activeParticipants.length}</p>
                 <p className="text-sm text-[#6d5c55]">{t('projectDetail.participants')}</p>
               </div>
             </div>
          </CardContent>
        </Card>
        {project.start_date && (
          <Card className="app-kpi-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="app-kpi-icon app-kpi-icon--info">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-lg font-semibold tracking-[-0.02em] text-[#231b18]">
                       {format(new Date(project.start_date), 'd MMM yyyy', { locale: dateLocale })}
                   </p>
                   <p className="text-sm text-[#6d5c55]">{t('projectDetail.startDate')}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        )}
        {project.end_date && (
          <Card className="app-kpi-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="app-kpi-icon app-kpi-icon--success">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-lg font-semibold tracking-[-0.02em] text-[#231b18]">
                       {format(new Date(project.end_date), 'd MMM yyyy', { locale: dateLocale })}
                   </p>
                   <p className="text-sm text-[#6d5c55]">{t('projectDetail.endDate')}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProjectSponsorshipCard
        projectId={projectId}
        user={user}
        participants={participants}
        companies={companies}
        companyMemberships={companyMemberships}
      />

      {/* Description */}
      {project.description && (
        <Card className="app-panel">
          <CardContent className="p-4">
            <p className="leading-7 text-[#6d5c55]">{project.description}</p>
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
                <h3 className="font-semibold text-red-900">{t('projectDetail.projectStopped')}</h3>
                <p className="text-sm text-red-700 mt-1">
                  {blockedTasks.length === 1 
                    ? `1 ${t('projectDetail.blockedTasks')}` 
                    : `${blockedTasks.length} ${t('projectDetail.blockedTasks')}`}
                  {blockedTasks[0]?.blocked_by_name && ` • ${tr('In attesa di', 'Waiting for')} ${blockedTasks[0].blocked_by_name}`}
                </p>
                <Button
                  variant="link"
                  className="text-red-700 hover:text-red-900 p-0 h-auto mt-1"
                  onClick={() => setActiveTab('lavori')}
                >
                  {t('projectDetail.seeDetails')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      {isActiveParticipant && <div className="border-t border-[rgba(197,177,165,0.48)]" />}

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
        <TabsList className="mb-4 h-auto flex-wrap">
          {!isBlockedProject ? (
          <TabsTrigger value="cantiere" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('projectDetail.tabs.overview')}
          </TabsTrigger>
          ) : null}
          {!isBlockedProject ? (
          <TabsTrigger value="lavori" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t('projectDetail.tabs.tasks')}
          </TabsTrigger>
          ) : null}
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isBlockedProject ? tr('Recupero sponsor', 'Sponsor recovery') : t('projectDetail.tabs.info')}
          </TabsTrigger>
        </TabsList>

        {/* CANTIERE TAB - Panoramica e Feed */}
        {!isBlockedProject ? (
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
        ) : null}

        {/* LAVORI TAB - Task e Change Requests */}
        {!isBlockedProject ? (
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
               {t('projectDetail.sections.viewAll')}
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
               {t('common.tasks')}
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
               {t('projectDetail.sections.changesExtras')}
             </Button>
            <Button
               variant={lavoriSection === 'disputes' ? 'default' : 'outline'}
               onClick={() => {
                 setLavoriSection('disputes');
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
               className={lavoriSection === 'disputes' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
             >
               {t('projectDetail.sections.disputes')}
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
               {t('projectDetail.sections.milestones')}
             </Button>
          </div>

          {/* Tasks section */}
          {(lavoriSection === 'all' || lavoriSection === 'tasks') && (
            <div id="section-tasks">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('projectDetail.sections.activities')}</h3>
              </div>
              <TaskList 
                projectId={projectId} 
                canEdit={canEditTasks} 
                filterMilestoneId={taskFilterMilestoneId}
                showMilestoneFilter={canUseMilestones}
                createDialogOpen={taskCreateOpen}
                onCreateDialogChange={setTaskCreateOpen}
              />
            </div>
          )}
          
          {/* Changes section */}
          {(lavoriSection === 'all' || lavoriSection === 'changes') && (
            <div id="section-changes" className={lavoriSection === 'all' ? 'border-t pt-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('projectDetail.sections.changesExtras')}</h3>
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
                <h3 className="text-lg font-semibold">{t('projectDetail.sections.milestones')}</h3>
              </div>
              {showMilestonesPlanGate ? (
                <FeatureGateCard
                  title={tr('Milestone premium', 'Premium milestones')}
                  description={tr(
                    'Le milestone sono disponibili nei cantieri sponsorizzati. In un cantiere free questa sezione resta visibile ma bloccata.',
                    'Milestones are available on sponsored worksites. On a free worksite this section stays visible but locked.',
                  )}
                  badgeLabel={tr('Cantiere sponsorizzato', 'Sponsored worksite')}
                />
              ) : (
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
              )}
            </div>
          )}

          {(lavoriSection === 'all' || lavoriSection === 'disputes') && (
            <div id="section-disputes" className={lavoriSection === 'all' ? 'border-t pt-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#ef6144]" />
                  {t('projectDetail.sections.disputes')}
                </h3>
              </div>
              <DisputeCaseList
                projectId={projectId}
                currentUser={user}
                currentParticipant={userParticipation}
                canCreate={canManageDisputes}
                canRespond={canManageDisputes}
                createDialogOpen={disputeCreateOpen}
                onCreateDialogChange={setDisputeCreateOpen}
              />
            </div>
          )}
        </TabsContent>
        ) : null}

        {/* Info & TEAM TAB */}
        <TabsContent value="info" className="space-y-6">
          {isBlockedProject ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {tr('Cantiere bloccato per perdita sponsor', 'Worksite blocked after sponsor loss')}
                    </h3>
                    <p className="mt-1 text-sm text-red-800">
                      {tr(
                        'Le aree premium sono state nascoste e il cantiere non puo essere usato come normale cantiere free. Da qui puoi solo gestire i partecipanti e invitare societa che possano riportare una sponsorship valida.',
                        'Premium areas are now hidden and the worksite cannot be used as a normal free worksite. From here you can only manage participants and invite companies that can restore a valid sponsorship.',
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Section selector */}
          <div className="flex gap-2 flex-wrap">
            {!isBlockedProject ? (
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
               {t('projectDetail.sections.viewAll')}
             </Button>
            ) : null}
             {!isBlockedProject ? (
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
               {t('projectDetail.sections.messaging')}
             </Button>
             ) : null}
             {!isBlockedProject ? (
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
               {t('projectDetail.sections.documents')}
             </Button>
             ) : null}
             {shouldShowFinanceButton ? (
               <Button
                 variant={infoSection === 'finance' ? 'default' : 'outline'}
                 onClick={() => {
                   setInfoSection('finance');
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
                 className={infoSection === 'finance' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
               >
                 {t('projectDetail.sections.finance')}
               </Button>
             ) : null}
             <Button
               variant={infoSection === 'participants' || isBlockedProject ? 'default' : 'outline'}
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
               className={infoSection === 'participants' || isBlockedProject ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
             >
               {isBlockedProject ? tr('Partecipanti e sponsor', 'Participants and sponsor') : t('projectDetail.sections.participants')}
             </Button>
          </div>

          {/* Chat Section */}
          {!isBlockedProject && (infoSection === 'all' || infoSection === 'chat') && (
            <div id="section-chat">
              <h3 className="text-lg font-semibold mb-4">{t('projectDetail.sections.messaging')}</h3>
              <ProjectMessaging
                projectId={projectId}
                currentUser={user}
                activeCompanyId={user?.active_company_id}
                participants={activeParticipants}
                canCreateChannels={canCreateProjectChannels}
                channelAccessMode={chatAccessMode}
                allowMilestoneMentions={canUseMilestones}
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

          {/* Documents Section */}
          {!isBlockedProject && (infoSection === 'all' || infoSection === 'documents') && (
            <Card id="section-documents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('projectDetail.sections.documents')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList 
                  projectId={projectId}
                  canUpload={isActiveParticipant}
                  currentUserEmail={user?.email}
                  uploadDialogOpen={documentUploadOpen}
                  onUploadDialogChange={setDocumentUploadOpen}
                  featureAccess={projectDocumentsFeatureAccess}
                />
              </CardContent>
            </Card>
          )}

          {shouldShowFinanceButton && !isBlockedProject && (infoSection === 'all' || infoSection === 'finance') && (
            <div id="section-finance" className={infoSection === 'all' ? 'border-t pt-6' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#ef6144]" />
                  {t('finance.sectionTitle')}
                </h3>
                {canViewFinanceSection ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-[#ef6144] hover:bg-[#d9553a] text-white"
                    onClick={() => {
                      const tour = getFinanceSectionTour(currentLanguage, financialPermissions.scope);
                      startTour(tour.id, tour.steps, { force: true });
                    }}
                    data-tour="finance-section-help-button"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {tr('Guida sezione', 'Section guide')}
                  </Button>
                ) : null}
              </div>
              {showFinancePlanGate ? (
                <FeatureGateCard
                  title={tr('Economia di cantiere premium', 'Premium worksite finance')}
                  description={tr(
                    'Budget, costi, SAL e impostazioni finanziarie si sbloccano solo quando il cantiere è sponsorizzato da una società paid.',
                    'Budget, costs, progress statements and financial settings unlock only when the worksite is sponsored by a paid company.',
                  )}
                  badgeLabel={tr('Richiede sponsorship', 'Requires sponsorship')}
                />
              ) : (
                <ProjectFinancialSection
                  projectId={projectId}
                  permissions={financialPermissions}
                  user={user}
                  participants={activeParticipants}
                />
              )}
            </div>
          )}

          {/* Participants Section */}
          {(infoSection === 'all' || infoSection === 'participants') && (
            <Card id="section-participants">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">{t('projectDetail.sections.participants')}</CardTitle>
                {canInvite && (
                  <Button 
                    onClick={() => setInviteDialogOpen(true)}
                    className="bg-[#ef6144] hover:bg-[#d9553a]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isBlockedProject ? tr('Invita società sponsor', 'Invite sponsor company') : t('projectDetail.invite')}
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
                        userDisplayName={participant.user_display_name}
                        companyName={participant.company_id ? getCompanyName(participant.company_id) : null}
                        canRemove={canRemoveParticipants && participant.id !== userParticipation?.id && participant.project_role !== 'homeowner'}
                        projectId={projectId}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title={t('projectDetail.sections.noParticipants')}
                    description={t('projectDetail.sections.inviteParticipants')}
                  />
                )}

                {invitedParticipants.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('projectDetail.sections.pendingConfirmation')}</h4>
                    <div className="space-y-3">
                      {invitedParticipants.map(participant => (
                        <ParticipantCard
                          key={participant.id}
                          participant={participant}
                          userDisplayName={participant.user_display_name}
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
        </TabsContent>
      </Tabs>
      }

      {/* Quick Action FAB - positioned next to Assistant button */}
      {isActiveParticipant && !isBlockedProject && (
        <button
          onClick={() => setQuickActionOpen(!quickActionOpen)}
          className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
        >
          <Plus className={`h-6 w-6 transition-transform ${quickActionOpen ? 'rotate-45' : ''}`} />
        </button>
      )}

      {/* Quick Action Menu */}
      {quickActionOpen && !isBlockedProject && (
        <div className="fixed bottom-24 right-24 bg-white rounded-lg shadow-xl border p-2 z-50 min-w-[200px]">
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('info', 'documents');
              setTimeout(() => setDocumentUploadOpen(true), 200);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <Upload className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{t('projectDetail.quickActions.uploadAttachment')}</span>
          </button>
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('lavori', 'tasks');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <CheckCircle2 className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{t('projectDetail.quickActions.updateTask')}</span>
          </button>
          <button
            onClick={() => {
              setQuickActionOpen(false);
              navigateToSection('lavori', 'changes');
              setTimeout(() => setChangeCreateOpen(true), 200);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
          >
            <DollarSign className="h-5 w-5 text-gray-700" />
            <span className="font-medium">{t('projectDetail.quickActions.newChange')}</span>
          </button>
        </div>
      )}

      <InviteParticipantDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={projectId}
        currentUserParticipation={userParticipation}
        projectPricingStatus={projectPricingStatus}
      />

      <EditProjectDialog
        open={editProjectDialogOpen}
        onOpenChange={setEditProjectDialogOpen}
        project={project}
      />
    </div>
  );
}