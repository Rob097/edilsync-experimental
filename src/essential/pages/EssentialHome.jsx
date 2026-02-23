import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Briefcase, Building2, CalendarClock, ArrowRight, Bell, MessageSquare } from 'lucide-react';
import { useEssentialData } from '@/essential/useEssentialData';
import { useLanguage } from '@/components/i18n/useLanguage';

function BigTile({ icon: Icon, title, value, subtitle, onClick }) {
  return (
    <Card className="cursor-pointer border-[#ef6144]/20 shadow-sm" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle ? <p className="text-sm text-gray-600 mt-2">{subtitle}</p> : null}
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-[#ef6144]" />
          </div>
        </div>
        <Button variant="outline" className="w-full mt-4 border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" onClick={onClick}>
          {subtitle || 'Apri'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EssentialHome() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [unreadNotificationsOpen, setUnreadNotificationsOpen] = useState(false);
  const [unreadMessagesOpen, setUnreadMessagesOpen] = useState(false);

  const {
    user,
    contextProjects,
    contextTasks,
    companies,
    currentContext,
    currentCompany,
    nextEvent,
    contextEvents,
  } = useEssentialData();

  const contextProjectIds = contextProjects.map((project) => project.id);

  const { data: allNotifications = [] } = useQuery({
    queryKey: ['essentialAllNotifications', user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const contextNotifications = allNotifications.filter((notification) => {
    if (currentContext === 'personal') {
      return notification.context_type === 'personal' || !notification.context_type;
    }
    return notification.context_type === 'company' && notification.context_company_id === user?.active_company_id;
  });
  const unreadNotifications = [...contextNotifications]
    .filter((notification) => !notification.is_read)
    .sort((first, second) => new Date(second.created_date) - new Date(first.created_date));
  const unreadNotificationsCount = unreadNotifications.length;

  const { data: channelMembers = [] } = useQuery({
    queryKey: ['essentialAllChannelMembers', user?.email],
    queryFn: () => appClient.entities.ChannelMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
  });

  const channelIds = channelMembers.map((member) => member.channel_id);

  const { data: channels = [] } = useQuery({
    queryKey: ['essentialUserChannels', channelIds],
    queryFn: async () => {
      if (channelIds.length === 0) return [];
      const allChannels = await appClient.entities.Channel.list();
      return allChannels.filter((channel) => channelIds.includes(channel.id));
    },
    enabled: channelIds.length > 0,
    staleTime: 30 * 1000,
  });

  const contextChannels = channels.filter((channel) => contextProjectIds.includes(channel.project_id));
  const contextChannelIds = contextChannels.map((channel) => channel.id);
  const contextChannelMembers = channelMembers.filter((member) => contextChannelIds.includes(member.channel_id));

  const { data: recentContextMessages = [] } = useQuery({
    queryKey: ['essentialRecentMessages', contextProjectIds],
    queryFn: () => {
      if (contextProjectIds.length === 0) return [];
      return appClient.entities.Message.filter({ project_id: contextProjectIds }, '-created_date');
    },
    enabled: contextProjectIds.length > 0,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const unreadMessages = recentContextMessages.filter((message) => {
    if (message.sender_email === user?.email) return false;
    const member = contextChannelMembers.find((entry) => entry.channel_id === message.channel_id);
    if (!member) return false;
    const lastRead = member.last_read_at ? new Date(member.last_read_at) : new Date(0);
    return new Date(message.created_date) > lastRead;
  });
  const unreadMessagesSorted = [...unreadMessages]
    .sort((first, second) => new Date(second.created_date) - new Date(first.created_date));
  const unreadMessagesCount = unreadMessagesSorted.length;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = contextEvents.filter((event) => format(new Date(event.start_datetime), 'yyyy-MM-dd') === todayKey);
  const todayTasks = contextTasks.filter((task) => task.due_date === todayKey || task.status === 'in_progress').slice(0, 6);
  const projectsInSummary = new Set([
    ...todayEvents.map((event) => event.project_id).filter(Boolean),
    ...todayTasks.map((task) => task.project_id).filter(Boolean),
  ]).size;

  const contextLabel = currentContext === 'company'
    ? `come ${currentCompany?.name || 'Società'}`
    : 'come privato';

  const eventWord = todayEvents.length === 1 ? 'evento' : 'eventi';
  const projectWord = projectsInSummary === 1 ? 'progetto' : 'progetti';

  const projectNameById = Object.fromEntries(contextProjects.map((project) => [project.id, project.name]));

  const summaryRows = [
    ...todayEvents.map((event) => ({
      id: `event-${event.id}`,
      type: 'event',
      sortTime: new Date(event.start_datetime),
      detailTime: format(new Date(event.start_datetime), 'HH:mm', { locale: dateLocale }),
      label: `${event.title} nel progetto ${projectNameById[event.project_id] || 'sconosciuto'} ${contextLabel}`,
    })),
    ...todayTasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task',
      sortTime: task.due_date ? new Date(`${task.due_date}T23:59:59`) : new Date(`${todayKey}T23:59:59`),
      detailTime: task.due_date
        ? `entro ${format(new Date(`${task.due_date}T00:00:00`), 'dd/MM', { locale: dateLocale })}`
        : 'in corso',
      label: `${task.title} nel progetto ${projectNameById[task.project_id] || 'sconosciuto'} ${contextLabel}`,
    })),
  ]
    .sort((first, second) => first.sortTime - second.sortTime)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">HomePage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUnreadNotificationsOpen(true)}
              className="rounded-xl border border-[#ef6144]/20 p-4 text-left hover:bg-[#ef6144]/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Bell className="h-4 w-4 text-[#ef6144]" />
                <span className="text-sm font-medium">Notifiche non lette</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{unreadNotificationsCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setUnreadMessagesOpen(true)}
              className="rounded-xl border border-[#ef6144]/20 p-4 text-left hover:bg-[#ef6144]/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="h-4 w-4 text-[#ef6144]" />
                <span className="text-sm font-medium">Messaggi non letti</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{unreadMessagesCount}</p>
            </button>
          </div>

          {(unreadNotificationsCount > 0 || unreadMessagesCount > 0) ? (
            <p className="text-sm text-gray-600">Hai aggiornamenti da controllare adesso.</p>
          ) : (
            <p className="text-sm text-gray-600">Sei aggiornato: non ci sono nuove notifiche o messaggi non letti.</p>
          )}

          <div className="border-t border-[#ef6144]/20" />

          <p className="text-gray-700 font-medium">
            {todayEvents.length > 0
              ? `Oggi hai ${todayEvents.length} ${eventWord} in ${projectsInSummary} ${projectWord}.`
              : todayTasks.length > 0
                ? `Oggi non hai eventi, ma hai ${todayTasks.length} attività da seguire.`
                : 'Oggi non hai eventi o attività urgenti.'}
          </p>
          {summaryRows.length > 0 ? (
            <ul className="space-y-2">
              {summaryRows.map((row) => (
                <li key={row.id} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.type === 'event' ? 'bg-[#ef6144]/10 text-[#ef6144]' : 'bg-blue-100 text-blue-700'}`}>
                    {row.type === 'event' ? 'Evento' : 'Attività'}
                  </span>
                  <span className="font-medium text-gray-700 min-w-[70px]">{row.detailTime}</span>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Nessun dettaglio operativo da mostrare in questo momento.</p>
          )}
        </CardContent>
      </Card>

      <BigTile
        icon={Briefcase}
        title="Progetti coinvolto"
        value={contextProjects.length}
        subtitle="Apri progetti"
        onClick={() => navigate('/essenziale/progetti')}
      />

      {currentContext === 'personal' ? (
        <BigTile
          icon={Building2}
          title="Società coinvolto"
          value={companies.length}
          subtitle="Apri società"
          onClick={() => navigate('/essenziale/societa')}
        />
      ) : null}

      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Prossimo evento</p>
              {nextEvent ? (
                <>
                  <p className="text-xl font-semibold text-gray-900 mt-2">{nextEvent.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(nextEvent.start_datetime), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                  </p>
                </>
              ) : (
                <p className="text-lg font-medium text-gray-900 mt-2">Nessun evento in arrivo</p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-[#ef6144]" />
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4 border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" onClick={() => navigate('/essenziale/calendario')}>
            Apri calendario
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={unreadNotificationsOpen} onOpenChange={setUnreadNotificationsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notifiche non lette</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-[#ef6144]/20 p-3">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(notification.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Nessuna notifica non letta nel contesto attuale.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={unreadMessagesOpen} onOpenChange={setUnreadMessagesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Messaggi non letti</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {unreadMessagesSorted.length > 0 ? (
              unreadMessagesSorted.map((message) => {
                const projectName = projectNameById[message.project_id] || 'Progetto';
                const channelName = contextChannels.find((channel) => channel.id === message.channel_id)?.name || 'Canale';
                return (
                  <div key={message.id} className="rounded-xl border border-[#ef6144]/20 p-3">
                    <p className="font-medium text-gray-900">{projectName} • {channelName}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(message.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600">Nessun messaggio non letto nel contesto attuale.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
