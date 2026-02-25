import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus } from 'lucide-react';
import EventDialog from '@/components/calendar/EventDialog';
import EventDetailDialog from '@/components/calendar/EventDetailDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { useEssentialData } from '@/essential/useEssentialData';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function EssentialCalendar() {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [filter, setFilter] = useState('upcoming');
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const {
    user,
    companyMemberships,
    currentContext,
    currentCompany,
    contextEvents,
    contextTasks,
    contextProjects,
  } = useEssentialData();

  const projectNameById = useMemo(() => contextProjects.reduce((accumulator, project) => {
    accumulator[project.id] = project.name;
    return accumulator;
  }, {}), [contextProjects]);

  const contextAssignedTasks = useMemo(() => contextTasks.filter((task) => {
    if (!task.due_date) return false;
    if (task.assigned_user_email === user?.email) return true;
    if (currentContext === 'company' && task.assigned_company_id === user?.active_company_id) return true;
    return false;
  }), [contextTasks, user?.email, user?.active_company_id, currentContext]);

  const calendarItems = useMemo(() => {
    const events = contextEvents.map((event) => ({
      ...event,
      entry_type: 'event',
    }));

    const tasks = contextAssignedTasks.map((task) => ({
      id: `task-${task.id}`,
      source_id: task.id,
      entry_type: 'task',
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      project_id: task.project_id,
      project_name: projectNameById[task.project_id],
      status: task.status,
      room_area: task.room_area,
    }));

    return [...events, ...tasks];
  }, [contextEvents, contextAssignedTasks, projectNameById]);

  const sortedEvents = useMemo(() => [...calendarItems]
    .sort((first, second) => {
      const firstDate = first.entry_type === 'task' ? new Date(first.due_date) : new Date(first.start_datetime);
      const secondDate = second.entry_type === 'task' ? new Date(second.due_date) : new Date(second.start_datetime);
      return firstDate - secondDate;
    }), [calendarItems]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayKey = format(now, 'yyyy-MM-dd');

    if (filter === 'today') {
      return sortedEvents.filter((event) => {
        if (event.entry_type === 'task') {
          return event.due_date === todayKey;
        }
        return format(new Date(event.start_datetime), 'yyyy-MM-dd') === todayKey;
      });
    }

    if (filter === 'past') {
      return sortedEvents.filter((event) => {
        const itemDate = event.entry_type === 'task' ? new Date(event.due_date) : new Date(event.start_datetime);
        return itemDate < now;
      }).reverse();
    }

    return sortedEvents.filter((event) => {
      const itemDate = event.entry_type === 'task' ? new Date(event.due_date) : new Date(event.start_datetime);
      return itemDate >= now;
    });
  }, [sortedEvents, filter]);

  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((accumulator, event) => {
      const dayKey = event.entry_type === 'task'
        ? event.due_date
        : format(new Date(event.start_datetime), 'yyyy-MM-dd');
      const existing = accumulator.find((entry) => entry.dayKey === dayKey);
      if (existing) {
        existing.events.push(event);
        return accumulator;
      }
      return [...accumulator, { dayKey, events: [event] }];
    }, []);
  }, [filteredEvents]);

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{tr('Calendario', 'Calendar')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => {
              setSelectedEvent(null);
              setEventDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {tr('Crea nuovo evento', 'Create new event')}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button className={filter === 'today' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'today' ? 'default' : 'outline'} onClick={() => setFilter('today')}>{tr('Oggi', 'Today')}</Button>
              <Button className={filter === 'upcoming' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>{tr('Prossimi', 'Upcoming')}</Button>
              <Button className={filter === 'past' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'past' ? 'default' : 'outline'} onClick={() => setFilter('past')}>{tr('Passati', 'Past')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {groupedEvents.map((group) => (
        <Card key={group.dayKey} className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {format(new Date(group.dayKey), 'EEEE dd MMMM yyyy', { locale: dateLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.events.map((event) => (
              <button
                key={event.id}
                type="button"
                className="w-full text-left rounded-lg border border-[#ef6144]/20 p-3"
                onClick={() => {
                  if (event.entry_type === 'event') {
                    setSelectedEvent(event);
                    setEventDetailOpen(true);
                  } else {
                    setSelectedTask(event);
                    setTaskDetailOpen(true);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {event.entry_type === 'task' ? `${tr('Attività', 'Task')}: ${event.title}` : event.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.entry_type === 'task'
                        ? tr('Scadenza giornata', 'Due today')
                        : format(new Date(event.start_datetime), 'HH:mm', { locale: dateLocale })}
                    </p>
                    {event.location ? <p className="text-sm text-gray-600">{event.location}</p> : null}
                    {event.entry_type === 'task' && event.project_name ? (
                      <p className="text-sm text-gray-600">{tr('Progetto', 'Project')}: {event.project_name}</p>
                    ) : null}
                  </div>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${event.entry_type === 'task' ? 'bg-blue-100' : 'bg-[#ef6144]/10'}`}>
                    <CalendarClock className={`h-4 w-4 ${event.entry_type === 'task' ? 'text-blue-700' : 'text-[#ef6144]'}`} />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      ))}

      {groupedEvents.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            {tr('Nessun evento disponibile per questo filtro.', 'No events available for this filter.')}
          </CardContent>
        </Card>
      ) : null}

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        currentContext={currentContext}
        currentCompany={currentCompany}
        user={user}
      />

      <EventDetailDialog
        open={eventDetailOpen}
        onOpenChange={setEventDetailOpen}
        event={selectedEvent}
        user={user}
        companyMemberships={companyMemberships}
        onEdit={(event) => {
          setEventDetailOpen(false);
          setSelectedEvent(event);
          setEventDialogOpen(true);
        }}
      />

      <TaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
      />
    </div>
  );
}
