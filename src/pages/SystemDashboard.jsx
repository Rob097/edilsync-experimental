import React, { useMemo } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Building2, 
  FolderKanban, 
  CheckSquare, 
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function SystemDashboard() {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  // Auth check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  // Fetch all data
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => appClient.entities.Company.list(),
    enabled: user?.role === 'admin',
  });

  const { data: companyMembers = [], isLoading: companyMembersLoading } = useQuery({
    queryKey: ['allCompanyMembers'],
    queryFn: () => appClient.entities.CompanyMember.list(),
    enabled: user?.role === 'admin',
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => appClient.entities.Project.list(),
    enabled: user?.role === 'admin',
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => appClient.entities.Task.list(),
    enabled: user?.role === 'admin',
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['allMilestones'],
    queryFn: () => appClient.entities.Milestone.list(),
    enabled: user?.role === 'admin',
  });

  const { data: changeRequests = [], isLoading: changeRequestsLoading } = useQuery({
    queryKey: ['allChangeRequests'],
    queryFn: () => appClient.entities.ChangeRequest.list(),
    enabled: user?.role === 'admin',
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => appClient.entities.Message.list(),
    enabled: user?.role === 'admin',
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => appClient.entities.ProjectDocument.list(),
    enabled: user?.role === 'admin',
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => appClient.entities.Event.list(),
    enabled: user?.role === 'admin',
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => appClient.entities.Notification.list(),
    enabled: user?.role === 'admin',
  });

  const isLoading = userLoading || usersLoading || companiesLoading || projectsLoading || tasksLoading || 
                    milestonesLoading || changeRequestsLoading || messagesLoading || documentsLoading || 
                    eventsLoading || notificationsLoading || companyMembersLoading;

  // Calculate statistics
  const stats = useMemo(() => {
    // Always return stats even if arrays are empty
    if (isLoading) return null;

    // User stats
    const adminUsers = allUsers.filter(u => u.role === 'admin').length;
    const regularUsers = allUsers.filter(u => u.role === 'normal').length;
    
    // Get users registered in last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newUsers = allUsers.filter(u => new Date(u.created_date) >= thirtyDaysAgo).length;

    // Company stats
    const activeCompanies = companies.filter(c => {
      const members = companyMembers.filter(m => m.company_id === c.id && m.status === 'active');
      return members.length > 0;
    }).length;

    // Project stats by status
    const projectsByStatus = {
      planning: projects.filter(p => p.status === 'planning').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      on_hold: projects.filter(p => p.status === 'on_hold').length,
    };

    // Task stats by status
    const tasksByStatus = {
      not_started: tasks.filter(t => t.status === 'not_started').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
    };

    // Milestone stats
    const milestonesByStatus = {
      pending: milestones.filter(m => m.status === 'pending').length,
      in_progress: milestones.filter(m => m.status === 'in_progress').length,
      completed: milestones.filter(m => m.status === 'completed').length,
      delayed: milestones.filter(m => m.status === 'delayed').length,
    };

    // Change request stats
    const changeRequestsByStatus = {
      pending: changeRequests.filter(cr => cr.status === 'pending').length,
      approved: changeRequests.filter(cr => cr.status === 'approved').length,
      rejected: changeRequests.filter(cr => cr.status === 'rejected').length,
      clarification_needed: changeRequests.filter(cr => cr.status === 'clarification_needed').length,
    };

    // Calculate average cost and time impact
    const approvedCRs = changeRequests.filter(cr => cr.status === 'approved');
    const avgCostImpact = approvedCRs.length > 0 
      ? approvedCRs.reduce((sum, cr) => sum + (cr.cost_impact || 0), 0) / approvedCRs.length 
      : 0;
    const avgTimeImpact = approvedCRs.length > 0 
      ? approvedCRs.reduce((sum, cr) => sum + (cr.time_impact_days || 0), 0) / approvedCRs.length 
      : 0;

    // Document stats by category
    const documentsByCategory = {
      project: documents.filter(d => d.category === 'project').length,
      contract: documents.filter(d => d.category === 'contract').length,
      permit: documents.filter(d => d.category === 'permit').length,
      drawing: documents.filter(d => d.category === 'drawing').length,
      photo: documents.filter(d => d.category === 'photo').length,
      report: documents.filter(d => d.category === 'report').length,
      other: documents.filter(d => d.category === 'other').length,
    };

    // Activity over last 30 days (new projects, tasks completed, messages)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
      
      return {
        date: format(date, 'dd/MM', { locale: dateLocale }),
        projects: projects.filter(p => format(startOfDay(new Date(p.created_date)), 'yyyy-MM-dd') === dateStr).length,
        tasks: tasks.filter(t => t.status === 'completed' && format(startOfDay(new Date(t.updated_date)), 'yyyy-MM-dd') === dateStr).length,
        messages: messages.filter(m => format(startOfDay(new Date(m.created_date)), 'yyyy-MM-dd') === dateStr).length,
      };
    });

    // Most active users (by tasks completed)
    const userActivity = allUsers.map(u => ({
      name: u.full_name || u.email,
      tasks: tasks.filter(t => t.created_by === u.email).length,
      projects: projects.filter(p => p.created_by === u.email).length,
    })).sort((a, b) => (b.tasks + b.projects) - (a.tasks + a.projects)).slice(0, 5);

    // Companies with most projects
    const companyActivity = companies.map(c => ({
      name: c.name,
      projects: projects.filter(p => p.owner_company_id === c.id).length,
      members: companyMembers.filter(m => m.company_id === c.id && m.status === 'active').length,
    })).sort((a, b) => b.projects - a.projects).slice(0, 5);

    return {
      users: {
        total: allUsers.length,
        admin: adminUsers,
        regular: regularUsers,
        new: newUsers,
      },
      companies: {
        total: companies.length,
        active: activeCompanies,
        avgMembers: companies.length > 0 ? (companyMembers.filter(m => m.status === 'active').length / companies.length).toFixed(1) : 0,
      },
      projects: {
        total: projects.length,
        byStatus: projectsByStatus,
      },
      tasks: {
        total: tasks.length,
        byStatus: tasksByStatus,
        completionRate: tasks.length > 0 ? ((tasksByStatus.completed / tasks.length) * 100).toFixed(1) : 0,
      },
      milestones: {
        total: milestones.length,
        byStatus: milestonesByStatus,
      },
      changeRequests: {
        total: changeRequests.length,
        byStatus: changeRequestsByStatus,
        avgCostImpact: avgCostImpact.toFixed(0),
        avgTimeImpact: avgTimeImpact.toFixed(1),
      },
      communication: {
        messages: messages.length,
        events: events.length,
        notifications: notifications.length,
      },
      documents: {
        total: documents.length,
        byCategory: documentsByCategory,
      },
      activity: {
        last30Days,
        topUsers: userActivity,
        topCompanies: companyActivity,
      },
    };
  }, [allUsers, companies, companyMembers, projects, tasks, milestones, changeRequests, messages, documents, events, notifications, isLoading, dateLocale]);

  // Access control
  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {tr('Questa dashboard è accessibile solo agli amministratori di sistema.', 'This dashboard is only available to system administrators.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ['#ef6144', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const documentCategoryLabels = {
    project: tr('Cantiere', 'Worksite'),
    contract: tr('Contratto', 'Contract'),
    permit: tr('Permesso', 'Permit'),
    drawing: tr('Disegno', 'Drawing'),
    photo: tr('Foto', 'Photo'),
    report: tr('Report', 'Report'),
    other: tr('Altro', 'Other'),
  };

  const projectStatusData = [
    { name: tr('In pianificazione', 'Planning'), value: stats.projects.byStatus.planning, color: '#f59e0b' },
    { name: tr('In corso', 'In progress'), value: stats.projects.byStatus.in_progress, color: '#3b82f6' },
    { name: tr('Completati', 'Completed'), value: stats.projects.byStatus.completed, color: '#10b981' },
    { name: tr('In pausa', 'On hold'), value: stats.projects.byStatus.on_hold, color: '#6b7280' },
  ];

  const taskStatusData = [
    { name: tr('Non avviato', 'Not started'), value: stats.tasks.byStatus.not_started, color: '#6b7280' },
    { name: tr('In corso', 'In progress'), value: stats.tasks.byStatus.in_progress, color: '#3b82f6' },
    { name: tr('Completato', 'Completed'), value: stats.tasks.byStatus.completed, color: '#10b981' },
    { name: tr('Bloccato', 'Blocked'), value: stats.tasks.byStatus.blocked, color: '#ef4444' },
  ];

  const documentCategoryData = Object.entries(stats.documents.byCategory).map(([key, value]) => ({
    name: documentCategoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('navigation.systemDashboard')}</h1>
          <p className="text-gray-500 mt-1">{tr("Panoramica completa dell'utilizzo di EdilSync", 'Complete overview of EdilSync usage')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>{tr('Aggiornato in tempo reale', 'Updated in real time')}</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{tr('Utenti totali', 'Total users')}</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats.users.new} {tr('negli ultimi 30 giorni', 'in the last 30 days')}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-gray-500">{tr('Admin', 'Admins')}: {stats.users.admin}</span>
              <span className="text-xs text-gray-500">{tr('Utenti', 'Users')}: {stats.users.regular}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{tr('Aziende attive', 'Active companies')}</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies.active}</div>
            <p className="text-xs text-gray-500 mt-1">
              {tr('su', 'out of')} {stats.companies.total} {tr('totali', 'total')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {tr('Media membri', 'Average members')}: {stats.companies.avgMembers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{tr('Cantieri attivi', 'Active worksites')}</CardTitle>
            <FolderKanban className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.byStatus.in_progress}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.projects.total} {tr('totali', 'total')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {stats.projects.byStatus.completed} {tr('completati', 'completed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{tr('Task completati', 'Completed tasks')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.byStatus.completed}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.tasks.total} {tr('totali', 'total')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {tr('Tasso completamento', 'Completion rate')}: {stats.tasks.completionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {tr('Attività ultimi 30 giorni', 'Activity in the last 30 days')}
            </CardTitle>
            <CardDescription>{tr('Nuovi cantieri, task completati e messaggi', 'New worksites, completed tasks, and messages')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.activity.last30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#ef6144" name={tr('Cantieri', 'Worksites')} strokeWidth={2} />
                <Line type="monotone" dataKey="tasks" stroke="#10b981" name="Task" strokeWidth={2} />
                <Line type="monotone" dataKey="messages" stroke="#3b82f6" name={tr('Messaggi', 'Messages')} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              {tr('Distribuzione cantieri per stato', 'Worksite distribution by status')}
            </CardTitle>
            <CardDescription>{stats.projects.total} {tr('cantieri totali', 'total worksites')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {tr('Stato task', 'Task status')}
            </CardTitle>
            <CardDescription>{stats.tasks.total} {tr('task totali', 'total tasks')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef6144">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {tr('Utenti più attivi', 'Most active users')}
            </CardTitle>
            <CardDescription>{tr('Per task e cantieri creati', 'By tasks and worksites created')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.activity.topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#10b981" name="Task" />
                <Bar dataKey="projects" fill="#ef6144" name={tr('Cantieri', 'Worksites')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {tr('Milestone', 'Milestones')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Totali', 'Total')}</span>
              <span className="font-semibold">{stats.milestones.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('In attesa', 'Pending')}</span>
              <span className="text-yellow-600">{stats.milestones.byStatus.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('In corso', 'In progress')}</span>
              <span className="text-blue-600">{stats.milestones.byStatus.in_progress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Completate', 'Completed')}</span>
              <span className="text-green-600">{stats.milestones.byStatus.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('In ritardo', 'Delayed')}</span>
              <span className="text-red-600">{stats.milestones.byStatus.delayed}</span>
            </div>
          </CardContent>
        </Card>

        {/* Change Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {tr('Richieste di modifica', 'Change requests')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Totali', 'Total')}</span>
              <span className="font-semibold">{stats.changeRequests.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('In attesa', 'Pending')}</span>
              <span className="text-yellow-600">{stats.changeRequests.byStatus.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Approvate', 'Approved')}</span>
              <span className="text-green-600">{stats.changeRequests.byStatus.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Rifiutate', 'Rejected')}</span>
              <span className="text-red-600">{stats.changeRequests.byStatus.rejected}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">{tr('Impatto medio approvate', 'Average approved impact')}:</div>
              <div className="text-sm">{tr('Costo', 'Cost')}: €{stats.changeRequests.avgCostImpact}</div>
              <div className="text-sm">{tr('Tempo', 'Time')}: {stats.changeRequests.avgTimeImpact} {tr('giorni', 'days')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Communication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {tr('Comunicazione', 'Communication')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Messaggi', 'Messages')}</span>
              <span className="font-semibold">{stats.communication.messages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Eventi', 'Events')}</span>
              <span className="font-semibold">{stats.communication.events}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{tr('Notifiche', 'Notifications')}</span>
              <span className="font-semibold">{stats.communication.notifications}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{tr('Documenti', 'Documents')}</span>
                <span className="font-semibold ml-auto">{stats.documents.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Companies */}
      {stats.activity.topCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {tr('Aziende con più cantieri', 'Companies with the most worksites')}
            </CardTitle>
            <CardDescription>{tr('Classifica per numero di cantieri gestiti', 'Ranking by number of managed worksites')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.activity.topCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ef6144] text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-xs text-gray-500">{company.members} {tr('membri', 'members')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{company.projects}</div>
                    <div className="text-xs text-gray-500">{tr('cantieri', 'worksites')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents by Category */}
      {stats.documents.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {tr('Distribuzione documenti per categoria', 'Document distribution by category')}
            </CardTitle>
            <CardDescription>{stats.documents.total} {tr('documenti totali', 'total documents')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef6144">
                  {documentCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}