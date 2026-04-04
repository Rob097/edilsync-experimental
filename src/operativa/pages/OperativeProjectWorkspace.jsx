import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { appClient } from '@/api/appClient';
import { useOperativeData } from '@/operativa/useOperativeData';
import { useLanguage } from '@/components/i18n/useLanguage';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MessageSquare, ListTodo, Plus, Clock, FileText, MapPin, User, Building2, Menu, UploadCloud, Loader2, ChevronDown, FolderTree, History, ShieldAlert, DollarSign } from 'lucide-react';
import ChannelList from '@/components/messaging/ChannelList';
import MessageList from '@/components/messaging/MessageList';
import MessageInput from '@/components/messaging/MessageInput';
import DisputeCaseList from '@/components/project/DisputeCaseList';
import FeatureGateCard from '@/components/ui/FeatureGateCard';
import { toast } from '@/components/ui/use-toast';
import { isFeatureAccessible, isFeatureFullyEnabled, isProjectBlockedForSponsorLoss, useProjectFeatureAccess, useProjectPricingStatus } from '@/hooks/useFeatureAccess';
import { setUiMode, UI_MODES } from '@/lib/ui-mode';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

const tabs = ['today', 'work', 'docs', 'chat'];

const taskStatusMeta = {
  not_started: { key: 'operational.taskStatusNotStarted', fallback: 'Non iniziata', className: 'bg-gray-100 text-gray-700' },
  in_progress: { key: 'operational.taskStatusInProgress', fallback: 'In corso', className: 'bg-blue-100 text-blue-700' },
  completed: { key: 'operational.taskStatusCompleted', fallback: 'Completata', className: 'bg-green-100 text-green-700' },
  blocked: { key: 'operational.taskStatusBlocked', fallback: 'Bloccata', className: 'bg-red-100 text-red-700' },
};

const LEGACY_TECHNICAL_CATEGORIES = new Set(['project', 'permit', 'drawing', 'technical']);
const BIM_FILE_TYPES = new Set(['ifc', 'glb', 'gltf']);

const normalizeCategory = (value) => (LEGACY_TECHNICAL_CATEGORIES.has(value) ? 'technical' : (value || 'other'));

export default function OperativeProjectWorkspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'today';
  const [activeTab, setActiveTab] = useState(tabs.includes(initialTab) ? initialTab : 'today');
  const [quickOpen, setQuickOpen] = useState(false);
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [entityDetailsOpen, setEntityDetailsOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('photo');
  const [docsView, setDocsView] = useState('chronological');
  const [chatShowChannels, setChatShowChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [focusedMessageId, setFocusedMessageId] = useState(null);
  const [redirectCreateTarget, setRedirectCreateTarget] = useState(null);
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const {
    user,
    activeCompanyId,
    currentCompany,
    contextProjects,
    contextTasks,
    contextEvents,
    isLoading,
  } = useOperativeData();

  const { featureMap: projectFeatureMap } = useProjectFeatureAccess(projectId, [
    'project_milestones',
    'project_chat',
    'project_documents',
  ], { enabled: !!projectId });
  const { projectPricingStatus } = useProjectPricingStatus(projectId, { enabled: !!projectId });

  const project = contextProjects.find((entry) => entry.id === projectId);
  const milestonesFeatureAccess = projectFeatureMap.project_milestones;
  const projectChatFeatureAccess = projectFeatureMap.project_chat;
  const projectDocumentsFeatureAccess = projectFeatureMap.project_documents;
  const canUseMilestones = isFeatureAccessible(milestonesFeatureAccess);
  const showMilestonesPlanGate = milestonesFeatureAccess?.access_level === 'disabled';
  const canUseProjectDocuments = isFeatureAccessible(projectDocumentsFeatureAccess);
  const projectDocumentsMode = projectDocumentsFeatureAccess?.config?.mode || null;
  const bimBlocked = projectDocumentsFeatureAccess?.access_level === 'limited' && ['basic', 'basic_chronological'].includes(projectDocumentsMode);
  const canCreateProjectChannels = isFeatureFullyEnabled(projectChatFeatureAccess);
  const chatAccessMode = isFeatureFullyEnabled(projectChatFeatureAccess) ? 'full' : 'general_only';
  const isGeneralOnlyChat = chatAccessMode === 'general_only';
  const isBlockedProject = isProjectBlockedForSponsorLoss(projectPricingStatus);

  const { data: participants = [] } = useQuery({
    queryKey: ['operativeProjectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const activeParticipants = participants.filter((participant) => participant.status === 'active');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    staleTime: 5 * 60 * 1000,
  });

  const sponsorCompany = projectPricingStatus?.sponsor_company_id
    ? allCompanies.find((company) => company.id === projectPricingStatus.sponsor_company_id) || null
    : null;
  const sponsorshipLabel = projectPricingStatus?.status === 'sponsored'
    ? tr(
      `Sponsorizzato da ${sponsorCompany?.name || projectPricingStatus.sponsor_company_id}`,
      `Sponsored by ${sponsorCompany?.name || projectPricingStatus.sponsor_company_id}`,
    )
    : tr('Non sponsorizzato', 'Unsponsored');

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }, 'target_date'),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: projectDocuments = [] } = useQuery({
    queryKey: ['projectDocuments', projectId],
    queryFn: () => appClient.entities.ProjectDocument.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: projectMessages = [] } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => appClient.entities.Message.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', projectId],
    queryFn: () => appClient.entities.Channel.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const projectTasks = contextTasks.filter((task) => task.project_id === projectId);
  const projectEvents = contextEvents.filter((event) => !event.project_id || event.project_id === projectId);

  const myProjectTasks = useMemo(() => projectTasks.filter((task) => {
    const assignedToUser = task.assigned_user_email === user?.email;
    const assignedToCompany = task.assigned_company_id === activeCompanyId;
    const unassigned = !task.assigned_participant_id;
    return assignedToUser || assignedToCompany || unassigned;
  }), [projectTasks, user?.email, activeCompanyId]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = myProjectTasks.filter((task) => task.due_date === todayKey || task.status === 'in_progress');

  const upcomingOrInProgressTasks = projectTasks.filter((task) => {
    if (task.status === 'in_progress' || task.status === 'not_started' || task.status === 'blocked') return true;
    if (!task.due_date) return false;
    return task.due_date >= todayKey;
  });

  const orderedMilestones = [...milestones].sort((first, second) => {
    const firstDate = first.target_date || first.start_date || '9999-12-31';
    const secondDate = second.target_date || second.start_date || '9999-12-31';
    return new Date(firstDate) - new Date(secondDate);
  });

  const orderedEvents = [...projectEvents].sort((first, second) => new Date(first.start_datetime) - new Date(second.start_datetime));

  const projectStatusLabel = project?.status
    ? t(`projects.status.${project.status}`, project.status)
    : '-';

  const roleLabel = (role) => {
    const roleMap = {
      homeowner: t('operational.homeowner'),
      contractor: t('inviteParticipantDialog.contractor'),
      subcontractor: t('inviteParticipantDialog.subcontractor'),
      architect: t('inviteParticipantDialog.architectRole'),
      engineer: t('inviteParticipantDialog.engineer'),
      surveyor: t('inviteParticipantDialog.surveyor'),
      designer: t('inviteParticipantDialog.designer'),
      consultant: t('inviteParticipantDialog.consultant'),
      supplier: t('inviteParticipantDialog.supplier'),
    };
    return roleMap[role] || role || '-';
  };

  const documentCategoryLabel = (category) => {
    const normalized = normalizeCategory(category);
    const map = {
      technical: t('operational.technicalDocumentation'),
      contract: t('operational.contracts'),
      photo: t('operational.photo'),
      report: t('operational.report'),
      other: t('operational.other'),
    };
    return map[normalized] || normalized || t('operational.other');
  };

  const milestoneStatusLabel = (status) => {
    const map = {
      pending: t('milestones.pending'),
      in_progress: t('milestones.inProgress'),
      completed: t('milestones.completed'),
      delayed: t('milestones.delayed'),
    };
    return map[status] || status || '-';
  };

  const changeStatusLabel = (status) => {
    const map = {
      pending: t('changeRequests.pending'),
      approved: t('changeRequests.approved'),
      rejected: t('changeRequests.rejected'),
      clarification_needed: t('changeRequests.clarificationNeeded'),
    };
    return map[status] || status || '-';
  };

  const latestHistoryItems = useMemo(() => {
    const taskItems = projectTasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task',
      entity: task,
      when: task.updated_date || task.created_date,
      label: `${t('operational.historyTask', { title: task.title })}`,
    }));

    const changeItems = changeRequests.map((request) => ({
      id: `change-${request.id}`,
      type: 'change_request',
      entity: request,
      when: request.updated_date || request.created_date,
      label: `${t('operational.historyChange', { title: request.title })}`,
    }));

    const messageItems = projectMessages.slice(0, 8).map((message) => ({
      id: `msg-${message.id}`,
      type: 'message',
      entity: message,
      when: message.created_date,
      label: `${t('operational.historyMessage', { name: message.sender_name || message.sender_email || '-' })}`,
    }));

    const documentItems = projectDocuments.slice(0, 8).map((document) => ({
      id: `doc-${document.id}`,
      type: 'document',
      entity: document,
      when: document.created_date,
      label: `${t('operational.historyDocument', { name: document.name })}`,
    }));

    return [...taskItems, ...changeItems, ...messageItems, ...documentItems]
      .sort((first, second) => new Date(second.when) - new Date(first.when))
      .slice(0, 10);
  }, [projectTasks, changeRequests, projectMessages, projectDocuments, t]);

  const contextParticipation = participants.find((participant) =>
    participant.participant_type === 'company'
    && participant.company_id === activeCompanyId
    && participant.status === 'active');

  const canRespondToChange = contextParticipation?.project_role === 'homeowner' || project?.owner_user_id === user?.id;
  const canCreateTaskFromFullMode = !!contextParticipation && !isBlockedProject;
  const canCreateChangeFromFullMode = canRespondToChange && !isBlockedProject;
  const canCreateDisputeFromFullMode = !!contextParticipation && !isBlockedProject;

  const generalChannel = isGeneralOnlyChat
    ? channels.find((channel) => channel.type === 'general') || null
    : null;

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) || generalChannel || null;

  const homeownerParticipant = participants.find((participant) => participant.project_role === 'homeowner');

  const homeownerLabel = homeownerParticipant
    ? (homeownerParticipant.participant_type === 'company'
      ? (allCompanies.find((company) => company.id === homeownerParticipant.company_id)?.name || homeownerParticipant.company_name || t('companies.title'))
      : getUserDisplayNameByEmail(homeownerParticipant.user_email, allUsers))
    : '-';

  const getParticipantLabel = (participant) => {
    if (participant.participant_type === 'company') {
      return allCompanies.find((company) => company.id === participant.company_id)?.name || participant.company_name || t('companies.title');
    }
    return getUserDisplayNameByEmail(participant.user_email, allUsers);
  };

  const documentsChronological = [...projectDocuments].sort((first, second) => new Date(second.created_date) - new Date(first.created_date));

  const docsByCategory = useMemo(() => {
    return documentsChronological.reduce((acc, document) => {
      const key = normalizeCategory(document.category);
      if (!acc[key]) acc[key] = [];
      acc[key].push(document);
      return acc;
    }, {});
  }, [documentsChronological]);

  const inferModelFormat = (fileType) => {
    if (fileType === 'ifc') return 'ifc';
    if (fileType === 'glb') return 'glb';
    if (fileType === 'gltf') return 'gltf';
    return null;
  };

  const isBimFileType = (fileType) => BIM_FILE_TYPES.has((fileType || '').toLowerCase());

  const openDocumentFile = async (document) => {
    if (!document) return;
    if (bimBlocked && isBimFileType(document.file_type || document.model_format)) {
      toast({
        title: tr('Preview BIM non disponibile', 'BIM preview unavailable'),
        description: tr('Nei progetti non sponsorizzati i file IFC, GLB e GLTF non sono apribili in anteprima.', 'On unsponsored projects, IFC, GLB, and GLTF files cannot be previewed.'),
      });
      return;
    }
    const url = await appClient.integrations.Core.ResolveFileAccessUrl({
      filePath: document.file_path,
      fallbackUrl: document.file_url,
    });
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => appClient.entities.Task.update(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operativeContextTasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const respondToChangeMutation = useMutation({
    mutationFn: ({ requestId, status }) => appClient.entities.ChangeRequest.update(requestId, {
      status,
      responded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) return;
      const fileType = uploadFile.name.split('.').pop()?.toLowerCase() || 'file';
      if (bimBlocked && isBimFileType(fileType)) {
        throw new Error(tr('I file BIM sono disponibili solo nei progetti sponsorizzati.', 'BIM files are available only on sponsored projects.'));
      }
      const uploaded = await appClient.integrations.Core.UploadFile({ file: uploadFile });
      await appClient.entities.ProjectDocument.create({
        project_id: projectId,
        name: uploadName.trim() || uploadFile.name,
        file_url: uploaded.file_url,
        file_path: uploaded.file_path,
        file_type: fileType,
        file_size: uploadFile.size,
        category: uploadCategory,
        model_format: inferModelFormat(fileType),
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.display_name || user?.full_name || user?.email,
      });
    },
    onSuccess: () => {
      setUploadFile(null);
      setUploadName('');
      setUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projectDocuments', projectId] });
    },
    onError: (error) => {
      toast({
        title: tr('Upload non disponibile', 'Upload unavailable'),
        description: error?.message || tr('Impossibile caricare il documento.', 'Unable to upload the document.'),
      });
    },
  });

  const openEntityDetails = (type, entity) => {
    setSelectedEntity({ type, entity });
    setEntityDetailsOpen(true);
  };

  const openQuickPhoto = () => {
    setUploadCategory('photo');
    setUploadOpen(true);
    setQuickOpen(false);
    setActiveTab('docs');
  };

  const openQuickDocument = () => {
    setUploadCategory('other');
    setUploadOpen(true);
    setQuickOpen(false);
    setActiveTab('docs');
  };

  const createRedirectMap = {
    task: {
      label: tr('attività', 'task'),
      title: tr('Nuova attività', 'New task'),
      section: 'tasks',
      create: 'task',
    },
    change: {
      label: tr('richiesta di modifica', 'change request'),
      title: tr('Nuova richiesta di modifica', 'New change request'),
      section: 'changes',
      create: 'change',
    },
    dispute: {
      label: tr('disputa', 'dispute'),
      title: tr('Nuova disputa', 'New dispute'),
      section: 'disputes',
      create: 'dispute',
    },
  };

  const openCreateRedirect = (targetKey) => {
    setQuickOpen(false);
    setRedirectCreateTarget(targetKey);
  };

  const confirmCreateRedirect = () => {
    const target = redirectCreateTarget ? createRedirectMap[redirectCreateTarget] : null;
    if (!target || !projectId) return;

    const params = new URLSearchParams({
      id: projectId,
      tab: 'lavori',
      section: target.section,
      create: target.create,
    });

    setUiMode(UI_MODES.NORMAL);
    setRedirectCreateTarget(null);
    navigate(`${createPageUrl('ProjectDetail')}?${params.toString()}`);
  };

  const handleChannelSelection = (channelId) => {
    setSelectedChannelId(channelId);
    setChatShowChannels(false);
    setFocusedMessageId(null);
  };

  useEffect(() => {
    if (!isGeneralOnlyChat) return;
    setChatShowChannels(false);
    if (generalChannel?.id && selectedChannelId !== generalChannel.id) {
      setSelectedChannelId(generalChannel.id);
      setFocusedMessageId(null);
    }
  }, [isGeneralOnlyChat, generalChannel?.id, selectedChannelId]);

  const openGoogleMaps = (address) => {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleHistoryItemClick = (item) => {
    if (!item) return;
    if (item.type === 'document') {
      if (item.entity) {
        openDocumentFile(item.entity);
      }
      return;
    }
    if (item.type === 'message') {
      if (item.entity?.channel_id) {
        setSelectedChannelId(item.entity.channel_id);
        setFocusedMessageId(item.entity.id);
        setChatShowChannels(false);
      }
      setActiveTab('chat');
      return;
    }
    openEntityDetails(item.type, item.entity);
  };

  const renderTaskQuickActions = (task, options = {}) => {
    const { showDetails = true } = options;
    return (
    <div className="flex gap-2 flex-wrap">
      {task.status !== 'in_progress' && task.status !== 'completed' && (
        <Button
          size="sm"
          variant="outline"
          className="border-[#ef6144]/30 text-[#ef6144]"
          onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'in_progress' })}
        >
          {t('operational.startTask')}
        </Button>
      )}
      <Button
        size="sm"
        className="bg-[#ef6144] hover:bg-[#d9553a]"
        onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'completed' })}
        disabled={task.status === 'completed'}
      >
        {t('operational.completeTask')}
      </Button>
      {showDetails && (
        <Button size="sm" variant="outline" onClick={() => openEntityDetails('task', task)}>
          {t('operational.details')}
        </Button>
      )}
    </div>
    );
  };

  const renderChangeQuickActions = (request) => (
    canRespondToChange && request.status === 'pending' ? (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => respondToChangeMutation.mutate({ requestId: request.id, status: 'rejected' })}>
          {t('operational.reject')}
        </Button>
        <Button size="sm" className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => respondToChangeMutation.mutate({ requestId: request.id, status: 'approved' })}>
          {t('operational.approve')}
        </Button>
      </div>
    ) : null
  );

  if (isLoading) {
    return <div className="text-sm text-gray-600">{t('common.loading')}</div>;
  }

  if (!project) {
    return (
      <Card className="border-[#ef6144]/20">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-gray-600">{t('operational.projectNotAvailable')}</p>
          <Button className="w-full" onClick={() => navigate('/app/operativa')}>{t('operational.backToSelection')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="operative-shell space-y-3 pb-24">
      <div className="operative-sticky-strip sticky top-16 z-20 pb-2">
        <Button variant="outline" className="w-full" onClick={() => navigate('/app/operativa')}>
          Torna alla home
        </Button>
      </div>

      <Card className="border-[#ef6144]/20">
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setProjectPanelOpen((prev) => !prev)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900">{project.name}</span>
            <ChevronDown className={`h-5 w-5 text-[#ef6144] transition-transform ${projectPanelOpen ? 'rotate-180' : ''}`} />
          </button>
          {projectPanelOpen && (
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4 text-[#ef6144]" />
                  <span className="font-medium">{t('newProject.siteAddress')}:</span>
                  {project.address ? (
                    <button
                      type="button"
                      className="text-[#ef6144] underline underline-offset-2"
                      onClick={() => openGoogleMaps(project.address)}
                    >
                      {project.address}
                    </button>
                  ) : <span>-</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-[#ef6144]" />
                  <span className="font-medium">{t('projectDetail.endDate')}:</span>
                  <span>{project.end_date ? format(new Date(`${project.end_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : t('operational.noEndDate')}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setProjectDetailsOpen(true)}>
                {t('operational.viewDetails')}
              </Button>
              {contextProjects.length > 1 && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/app/operativa')}>
                  {t('operational.changeProject')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeTab === 'today' && (
        <Card className="border-[#ef6144]/20">
          <CardHeader>
            <CardTitle className="text-base">{t('operational.todaySection')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[48vh] overflow-y-auto">
            {todayTasks.length > 0 ? todayTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-[#ef6144]/20 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <Badge className={(taskStatusMeta[task.status] || taskStatusMeta.not_started).className}>
                    {t((taskStatusMeta[task.status] || taskStatusMeta.not_started).key, (taskStatusMeta[task.status] || taskStatusMeta.not_started).fallback)}
                  </Badge>
                </div>
                {renderTaskQuickActions(task)}
              </div>
            )) : <p className="text-sm text-gray-600">{t('operational.noTodayItems')}</p>}
          </CardContent>
        </Card>
      )}

      {activeTab === 'work' && (
        <Card className="border-[#ef6144]/20">
          <CardHeader>
            <CardTitle className="text-base">{t('operational.workSection')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[48vh] overflow-y-auto">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="history">
                <AccordionTrigger>{t('operational.activityHistory')}</AccordionTrigger>
                <AccordionContent className="space-y-2 max-h-[30vh] overflow-y-auto">
                  {latestHistoryItems.length > 0 ? latestHistoryItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleHistoryItemClick(item)}
                      className="w-full text-left rounded-lg border border-[#ef6144]/20 p-2"
                    >
                      <p className="text-sm text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(item.when), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                    </button>
                  )) : <p className="text-sm text-gray-600">{t('operational.noHistory')}</p>}
                </AccordionContent>
              </AccordionItem>

              {(orderedMilestones.length > 0 || showMilestonesPlanGate) && (
                <AccordionItem value="milestones">
                  <AccordionTrigger>{t('operational.milestones')}</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                      {showMilestonesPlanGate ? (
                        <FeatureGateCard
                          compact
                          title={tr('Milestone premium', 'Premium milestones')}
                          description={tr(
                            'Le milestone sono disponibili solo nei progetti sponsorizzati.',
                            'Milestones are available only on sponsored projects.',
                          )}
                          badgeLabel={tr('Progetto sponsorizzato', 'Sponsored project')}
                        />
                      ) : orderedMilestones.length > 0 ? (
                        orderedMilestones.map((milestone) => (
                          <button
                            key={milestone.id}
                            type="button"
                            onClick={() => openEntityDetails('milestone', milestone)}
                            className="w-full text-left rounded-lg border border-[#ef6144]/20 p-2"
                          >
                            <p className="font-medium text-gray-900 text-sm">{milestone.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {milestone.start_date ? format(new Date(`${milestone.start_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}
                              {' - '}
                              {milestone.target_date ? format(new Date(`${milestone.target_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}
                            </p>
                            <Badge className="mt-2 bg-[#ef6144]/10 text-[#ef6144]">{milestoneStatusLabel(milestone.status)}</Badge>
                          </button>
                        ))
                      ) : <p className="text-sm text-gray-600">{t('milestones.noMilestones')}</p>}
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="tasks">
                <AccordionTrigger>{t('operational.tasksSection')}</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {canCreateTaskFromFullMode && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => openCreateRedirect('task')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {tr('Crea in modalità completa', 'Create in full mode')}
                    </Button>
                  )}
                  {upcomingOrInProgressTasks.length > 0 ? upcomingOrInProgressTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-[#ef6144]/20 p-2 space-y-2">
                      <div className="flex justify-between gap-2 items-start">
                        <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                        <Badge className={(taskStatusMeta[task.status] || taskStatusMeta.not_started).className}>
                          {t((taskStatusMeta[task.status] || taskStatusMeta.not_started).key, (taskStatusMeta[task.status] || taskStatusMeta.not_started).fallback)}
                        </Badge>
                      </div>
                      {renderTaskQuickActions(task)}
                    </div>
                  )) : <p className="text-sm text-gray-600">{t('operational.noTasks')}</p>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="changes">
                <AccordionTrigger>{t('operational.changeRequests')}</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {canCreateChangeFromFullMode && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => openCreateRedirect('change')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {tr('Crea in modalità completa', 'Create in full mode')}
                    </Button>
                  )}
                  {changeRequests.length > 0 ? changeRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-[#ef6144]/20 p-2 space-y-2">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => openEntityDetails('change_request', request)}
                      >
                        <p className="font-medium text-gray-900 text-sm">{request.title}</p>
                      </button>
                      <p className="text-xs text-gray-600">{request.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#ef6144]/10 text-[#ef6144]">{changeStatusLabel(request.status)}</Badge>
                        {renderChangeQuickActions(request)}
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-600">{t('operational.noChangeRequests')}</p>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="disputes">
                <AccordionTrigger>{t('disputes.title')}</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {canCreateDisputeFromFullMode && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => openCreateRedirect('dispute')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {tr('Crea in modalità completa', 'Create in full mode')}
                    </Button>
                  )}
                  <DisputeCaseList
                    projectId={projectId}
                    currentUser={user}
                    currentParticipant={contextParticipation}
                    canCreate={false}
                    canRespond={!!contextParticipation}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="events">
                <AccordionTrigger>{t('operational.calendarEvents')}</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {orderedEvents.length > 0 ? orderedEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEntityDetails('event', event)}
                      className="w-full text-left rounded-lg border border-[#ef6144]/20 p-2"
                    >
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(event.start_datetime), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                    </button>
                  )) : <p className="text-sm text-gray-600">{t('operational.noCalendarItems')}</p>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {activeTab === 'docs' && (
        canUseProjectDocuments ? (
          <Card className="border-[#ef6144]/20">
            <CardHeader>
              <CardTitle className="text-base">{t('operational.docsSection')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[48vh] overflow-y-auto">
              <p className="text-xs text-gray-500">{t('operational.docsOrderedInfo')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={docsView === 'chronological' ? 'default' : 'outline'}
                  className={docsView === 'chronological' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
                  onClick={() => setDocsView('chronological')}
                >
                  <History className="h-4 w-4 mr-2" />
                  {t('operational.docsChronological')}
                </Button>
                <Button
                  variant={docsView === 'explorer' ? 'default' : 'outline'}
                  className={docsView === 'explorer' ? 'bg-[#ef6144] hover:bg-[#d9553a]' : ''}
                  onClick={() => setDocsView('explorer')}
                >
                  <FolderTree className="h-4 w-4 mr-2" />
                  {t('operational.docsExplorer')}
                </Button>
              </div>
              <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => setUploadOpen(true)}>
                <UploadCloud className="h-4 w-4 mr-2" />
                {t('operational.addPhoto')}
              </Button>
              {projectDocuments.length > 0 ? (
                docsView === 'chronological' ? (
                  documentsChronological.map((document) => (
                    <div key={document.id} className="rounded-lg border border-[#ef6144]/20 p-3">
                      <p className="font-medium text-gray-900">{document.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(document.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                        {' • '}
                        {documentCategoryLabel(document.category)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => openDocumentFile(document)}>
                        {t('operational.openFile')}
                      </Button>
                    </div>
                  ))
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(docsByCategory).map(([category, docs]) => (
                      <AccordionItem key={category} value={`cat-${category}`}>
                        <AccordionTrigger>{`${documentCategoryLabel(category)} (${docs.length})`}</AccordionTrigger>
                        <AccordionContent className="space-y-2 max-h-[26vh] overflow-y-auto">
                          {docs.map((document) => (
                            <div key={document.id} className="rounded-lg border border-[#ef6144]/20 p-3">
                              <p className="font-medium text-gray-900">{document.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{format(new Date(document.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                              <Button size="sm" variant="outline" className="mt-2" onClick={() => openDocumentFile(document)}>
                                {t('operational.openFile')}
                              </Button>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )
              ) : <p className="text-sm text-gray-600">{t('documents.noDocuments')}</p>}
            </CardContent>
          </Card>
        ) : (
          <FeatureGateCard
            compact
            title={tr('Documenti premium', 'Premium documents')}
            description={tr(
              'I documenti avanzati del progetto si sbloccano solo quando il progetto è sponsorizzato.',
              'Advanced project documents unlock only when the project is sponsored.',
            )}
            badgeLabel={tr('Richiede sponsorship', 'Requires sponsorship')}
          />
        )
      )}

      {activeTab === 'chat' && (
        <Card className="border-[#ef6144]/20 h-[66vh] flex flex-col overflow-hidden">
          <div className="border-b p-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{selectedChannel?.name || t('operational.channels')}</p>
            </div>
            {!isGeneralOnlyChat && (
              <Button variant="ghost" size="icon" onClick={() => setChatShowChannels((prev) => !prev)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {!isGeneralOnlyChat && (chatShowChannels || !selectedChannelId) ? (
            <div className="p-3 overflow-y-auto">
              <ChannelList
                scopeType="project"
                scopeId={projectId}
                projectId={projectId}
                currentUserEmail={user?.email}
                activeCompanyId={activeCompanyId}
                selectedChannelId={selectedChannelId}
                onSelectChannel={handleChannelSelection}
                participants={activeParticipants}
                canCreateChannels={canCreateProjectChannels}
                channelAccessMode={chatAccessMode}
              />
            </div>
          ) : (
            <>
              <MessageList
                channelId={selectedChannelId}
                projectId={projectId}
                currentUserEmail={user?.email}
                focusedMessageId={focusedMessageId}
              />
              <MessageInput
                channelId={selectedChannelId}
                projectId={projectId}
                currentUserEmail={user?.email}
                currentUserName={user?.full_name || user?.display_name}
                contextType="company"
                activeCompanyId={activeCompanyId}
                activeCompanyName={currentCompany?.name}
                participants={activeParticipants}
                allowMilestoneMentions={canUseMilestones && !isGeneralOnlyChat}
              />
            </>
          )}
        </Card>
      )}

      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-[#ef6144] hover:bg-[#d9553a] shadow-lg"
        onClick={() => setQuickOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ef6144]/20 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <Button variant={activeTab === 'today' ? 'default' : 'ghost'} className={activeTab === 'today' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-12 flex-col' : 'h-12 flex-col'} onClick={() => setActiveTab('today')}>
            <Clock className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.todayTab')}</span>
          </Button>
          <Button variant={activeTab === 'work' ? 'default' : 'ghost'} className={activeTab === 'work' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-12 flex-col' : 'h-12 flex-col'} onClick={() => setActiveTab('work')}>
            <ListTodo className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.workTab')}</span>
          </Button>
          <Button variant={activeTab === 'docs' ? 'default' : 'ghost'} className={activeTab === 'docs' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-12 flex-col' : 'h-12 flex-col'} onClick={() => setActiveTab('docs')}>
            <FileText className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.docsTab')}</span>
          </Button>
          <Button variant={activeTab === 'chat' ? 'default' : 'ghost'} className={activeTab === 'chat' ? 'bg-[#ef6144] hover:bg-[#d9553a] h-12 flex-col' : 'h-12 flex-col'} onClick={() => setActiveTab('chat')}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.chatTab')}</span>
          </Button>
        </div>
      </div>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('operational.quickActions')}</DialogTitle>
            <DialogDescription>
              {tr('Azioni rapide disponibili in modalità operativa.', 'Quick actions available in operational mode.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => { setQuickOpen(false); setActiveTab('chat'); }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('operational.openChat')}
            </Button>
            <Button className="w-full" variant="outline" onClick={openQuickPhoto} disabled={!canUseProjectDocuments}>
              <UploadCloud className="h-4 w-4 mr-2" />
              {t('operational.addPhoto')}
            </Button>
            <Button className="w-full" variant="outline" onClick={openQuickDocument} disabled={!canUseProjectDocuments}>
              <FileText className="h-4 w-4 mr-2" />
              {t('operational.addDocument')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => openCreateRedirect('task')} disabled={!canCreateTaskFromFullMode}>
              <ListTodo className="h-4 w-4 mr-2" />
              {tr('Nuova attività', 'New task')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => openCreateRedirect('change')} disabled={!canCreateChangeFromFullMode}>
              <DollarSign className="h-4 w-4 mr-2" />
              {tr('Nuova richiesta', 'New change request')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => openCreateRedirect('dispute')} disabled={!canCreateDisputeFromFullMode}>
              <ShieldAlert className="h-4 w-4 mr-2" />
              {tr('Nuova disputa', 'New dispute')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!redirectCreateTarget} onOpenChange={(open) => { if (!open) setRedirectCreateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr('Passare alla modalità completa?', 'Switch to full mode?')}</DialogTitle>
            <DialogDescription>
              {redirectCreateTarget ? tr(
                `La creazione di questa ${createRedirectMap[redirectCreateTarget].label} è disponibile solo nella modalità completa.`,
                `Creating this ${createRedirectMap[redirectCreateTarget].label} is available only in full mode.`,
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              {tr(
                'Si aprirà direttamente il modulo corretto. Potrai tornare alla modalità operativa dal menu utente.',
                'The correct form will open directly. You can return to operational mode from the user menu.',
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRedirectCreateTarget(null)}>
                {tr('Annulla', 'Cancel')}
              </Button>
              <Button className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]" onClick={confirmCreateRedirect}>
                {tr('Continua', 'Continue')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={projectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('operational.projectDetails')}</DialogTitle>
            <DialogDescription>
              {tr('Dettagli sintetici del progetto corrente in modalità operativa.', 'Summary details for the current project in operational mode.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-[#ef6144]/20 p-3 space-y-2">
              <p><strong>{t('newProject.projectName')}:</strong> {project.name || '-'}</p>
              <p><strong>{t('newProject.description')}:</strong> {project.description || '-'}</p>
              <p><strong>{t('operational.homeowner')}:</strong> {homeownerLabel}</p>
              <p><strong>{tr('Sponsorship', 'Sponsorship')}:</strong> {sponsorshipLabel}</p>
              <p><strong>{t('newProject.siteAddress')}:</strong> {project.address ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`} target="_blank" rel="noopener noreferrer" className="text-[#ef6144] underline underline-offset-2">{project.address}</a> : '-'}</p>
              <p><strong>{t('tasks.status')}:</strong> {projectStatusLabel}</p>
              <p><strong>{t('projectDetail.startDate')}:</strong> {project.start_date ? format(new Date(`${project.start_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}</p>
              <p><strong>{t('projectDetail.endDate')}:</strong> {project.end_date ? format(new Date(`${project.end_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}</p>
            </div>
            <div>
              <p className="font-semibold mb-2">{t('projectDetail.participants')}</p>
              <div className="space-y-2">
                {activeParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between rounded-lg border border-[#ef6144]/20 p-2">
                    <span className="flex items-center gap-1">
                      {participant.participant_type === 'company' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      {getParticipantLabel(participant)}
                    </span>
                    <Badge variant="outline">{roleLabel(participant.project_role)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={entityDetailsOpen} onOpenChange={setEntityDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntity?.type === 'task' ? t('operational.taskDetails') :
               selectedEntity?.type === 'milestone' ? t('operational.milestones') :
               selectedEntity?.type === 'change_request' ? t('operational.changeRequests') :
               selectedEntity?.type === 'event' ? t('operational.calendarEvents') : t('operational.details')}
            </DialogTitle>
            <DialogDescription>
              {tr('Dettaglio dell elemento selezionato.', 'Details for the selected item.')}
            </DialogDescription>
          </DialogHeader>
          {selectedEntity?.entity ? (
            <div className="space-y-3 text-sm">
              {selectedEntity.type === 'task' && (
                <div className="space-y-2 rounded-lg border border-[#ef6144]/20 p-3">
                  <p><strong>{t('taskDialog.title')}:</strong> {selectedEntity.entity.title}</p>
                  <p><strong>{t('taskDialog.description')}:</strong> {selectedEntity.entity.description || '-'}</p>
                  <p><strong>{t('tasks.status')}:</strong> {t((taskStatusMeta[selectedEntity.entity.status] || taskStatusMeta.not_started).key, (taskStatusMeta[selectedEntity.entity.status] || taskStatusMeta.not_started).fallback)}</p>
                  <p><strong>{t('tasks.dueDate')}:</strong> {selectedEntity.entity.due_date ? format(new Date(`${selectedEntity.entity.due_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : t('operational.noDueDate')}</p>
                  <p><strong>{t('taskDialog.roomArea')}:</strong> {selectedEntity.entity.room_area || '-'}</p>
                  {renderTaskQuickActions(selectedEntity.entity, { showDetails: false })}
                </div>
              )}

              {selectedEntity.type === 'milestone' && (
                <div className="space-y-2 rounded-lg border border-[#ef6144]/20 p-3">
                  <p><strong>{t('milestones.milestone')}:</strong> {selectedEntity.entity.title}</p>
                  <p><strong>{t('taskDialog.description')}:</strong> {selectedEntity.entity.description || '-'}</p>
                  <p><strong>{t('tasks.status')}:</strong> {milestoneStatusLabel(selectedEntity.entity.status)}</p>
                  <p><strong>{t('projectDetail.startDate')}:</strong> {selectedEntity.entity.start_date ? format(new Date(`${selectedEntity.entity.start_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}</p>
                  <p><strong>{t('projectDetail.endDate')}:</strong> {selectedEntity.entity.target_date ? format(new Date(`${selectedEntity.entity.target_date}T00:00:00`), 'dd MMM yyyy', { locale: dateLocale }) : '-'}</p>
                </div>
              )}

              {selectedEntity.type === 'change_request' && (
                <div className="space-y-2 rounded-lg border border-[#ef6144]/20 p-3">
                  <p><strong>{t('changeRequestDialog.title')}:</strong> {selectedEntity.entity.title}</p>
                  <p><strong>{t('changeRequestDialog.description')}:</strong> {selectedEntity.entity.description || '-'}</p>
                  <p><strong>{t('tasks.status')}:</strong> {changeStatusLabel(selectedEntity.entity.status)}</p>
                  <p><strong>{t('changeRequestDialog.costImpact')}:</strong> {selectedEntity.entity.cost_impact || 0}</p>
                  <p><strong>{t('changeRequestDialog.timeImpact')}:</strong> {selectedEntity.entity.time_impact_days || 0}</p>
                  {renderChangeQuickActions(selectedEntity.entity)}
                </div>
              )}

              {selectedEntity.type === 'event' && (
                <div className="space-y-2 rounded-lg border border-[#ef6144]/20 p-3">
                  <p><strong>{t('events.title')}:</strong> {selectedEntity.entity.title}</p>
                  <p><strong>{t('events.startTime')}:</strong> {format(new Date(selectedEntity.entity.start_datetime), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                  <p><strong>{t('events.endTime')}:</strong> {format(new Date(selectedEntity.entity.end_datetime), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                  <p><strong>{t('events.location')}:</strong> {selectedEntity.entity.location || '-'}</p>
                  <p><strong>{t('taskDialog.description')}:</strong> {selectedEntity.entity.description || '-'}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('operational.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {tr('Carica un file nel progetto corrente dalla modalità operativa.', 'Upload a file to the current project from operational mode.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept={bimBlocked ? 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.dwg,.dxf,.zip,.rar' : 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.dwg,.dxf,.ifc,.glb,.gltf,.zip,.rar'} onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            {bimBlocked ? <p className="text-xs text-amber-700">{tr('IFC, GLB e GLTF si attivano solo quando il progetto è sponsorizzato.', 'IFC, GLB, and GLTF unlock only when the project is sponsored.')}</p> : null}
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">{t('operational.technicalDocumentation')}</SelectItem>
                <SelectItem value="contract">{t('operational.contracts')}</SelectItem>
                <SelectItem value="photo">{t('operational.photo')}</SelectItem>
                <SelectItem value="report">{t('operational.report')}</SelectItem>
                <SelectItem value="other">{t('operational.other')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={uploadName}
              onChange={(event) => setUploadName(event.target.value)}
              placeholder={t('operational.fileNameOptional')}
            />
            <Button
              className="w-full bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!uploadFile || uploadDocumentMutation.isPending}
              onClick={() => uploadDocumentMutation.mutate()}
            >
              {uploadDocumentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
              {t('operational.uploadNow')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
