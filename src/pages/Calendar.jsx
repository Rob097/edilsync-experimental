import React, { useState, useMemo } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton.jsx";
import ContextBadge from '@/components/context/ContextBadge';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import EventDialog from '@/components/calendar/EventDialog';
import EventDetailDialog from '@/components/calendar/EventDetailDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function Calendar() {
  const { t, currentLanguage } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await appClient.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['calendarProjectParticipations', user?.id, companyMemberships],
    queryFn: async () => {
      const allParticipations = await appClient.entities.ProjectParticipant.list();
      const companyIds = companyMemberships.map(m => m.company_id);

      return allParticipations.filter((participation) =>
        (participation.status === 'active' || participation.status === 'invited') && (
          (participation.participant_type === 'personal' && participation.user_id === user?.id) ||
          (participation.participant_type === 'company' && companyIds.includes(participation.company_id))
        )
      );
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['calendarProjects', projectParticipations],
    queryFn: async () => {
      if (projectParticipations.length === 0) return [];
      const projectIds = [...new Set(projectParticipations.map(p => p.project_id))];
      const allProjects = await appClient.entities.Project.list();
      return allProjects.filter(project => projectIds.includes(project.id));
    },
    enabled: projectParticipations.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => appClient.entities.Event.filter({ status: 'scheduled' }),
    staleTime: 60 * 1000,
  });

  const { data: eventParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['eventParticipants'],
    queryFn: () => appClient.entities.EventParticipant.list(),
    enabled: events.length > 0,
    staleTime: 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

  const contextProjectIds = useMemo(() => {
    return projectParticipations
      .filter(participation => {
        if (currentContext === 'personal') {
          return participation.participant_type === 'personal' && participation.user_id === user?.id;
        }
        return participation.participant_type === 'company' && participation.company_id === user?.active_company_id;
      })
      .map(participation => participation.project_id);
  }, [projectParticipations, currentContext, user?.id, user?.active_company_id]);

  const { data: contextProjectTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['calendarContextTasks', contextProjectIds],
    queryFn: () => {
      if (contextProjectIds.length === 0) return [];
      return appClient.entities.Task.filter({ project_id: contextProjectIds }, '-created_date');
    },
    enabled: contextProjectIds.length > 0,
    staleTime: 60 * 1000,
  });

  // Filter events based on user involvement
  const userEvents = useMemo(() => {
    const companyIds = companyMemberships.map(m => m.company_id);
    
    return events.filter(event => {
      // User is creator
      if (event.creator_email === user?.email) return true;
      
      // User owns the event personally
      if (event.owner_type === 'personal' && event.owner_user_id === user?.id) return true;
      
      // User's company owns the event
      if (event.owner_type === 'company' && companyIds.includes(event.owner_company_id)) return true;
      
      // User is a participant
      const isParticipant = eventParticipants.some(p => 
        p.event_id === event.id && 
        ((p.participant_type === 'user' && p.user_email === user?.email) ||
         (p.participant_type === 'company' && companyIds.includes(p.company_id)))
      );
      if (isParticipant) return true;
      
      return false;
    });
  }, [events, eventParticipants, user, companyMemberships]);

  // Context-filtered events
  const contextEvents = useMemo(() => {
    if (currentContext === 'personal') {
      return userEvents.filter(e => 
        e.owner_type === 'personal' || 
        eventParticipants.some(p => p.event_id === e.id && p.user_email === user?.email)
      );
    } else {
      return userEvents.filter(e => 
        e.owner_company_id === user?.active_company_id ||
        eventParticipants.some(p => p.event_id === e.id && p.company_id === user?.active_company_id)
      );
    }
  }, [userEvents, currentContext, user, eventParticipants]);

  const projectNameById = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
  }, [projects]);

  const contextAssignedTasks = useMemo(() => {
    return contextProjectTasks.filter(task => {
      if (!task.due_date) return false;
      if (task.assigned_user_email === user?.email) return true;

      if (currentContext === 'company' && task.assigned_company_id === user?.active_company_id) {
        return true;
      }

      return false;
    });
  }, [contextProjectTasks, currentContext, user?.email, user?.active_company_id]);

  const contextCalendarItems = useMemo(() => {
    const eventItems = contextEvents.map(event => ({
      ...event,
      entry_type: 'event',
    }));

    const taskItems = contextAssignedTasks.map(task => ({
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

    return [...eventItems, ...taskItems];
  }, [contextEvents, contextAssignedTasks, projectNameById]);

  // Calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return contextCalendarItems.filter(item => {
      const currentDateDay = format(day, 'yyyy-MM-dd');

      if (item.entry_type === 'task') {
        return item.due_date === currentDateDay;
      }

      const startDate = new Date(item.start_datetime);
      const endDate = new Date(item.end_datetime);
      const currentDate = new Date(format(day, 'yyyy-MM-dd'));
      const eventStartDay = new Date(format(startDate, 'yyyy-MM-dd'));
      const eventEndDay = new Date(format(endDate, 'yyyy-MM-dd'));

      return currentDate >= eventStartDay && currentDate <= eventEndDay;
    });
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  const handleTaskClick = (task, e) => {
    e?.stopPropagation?.();
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const weekDays = currentLanguage === 'it'
    ? ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  if (userLoading || eventsLoading || participantsLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-visible">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="app-page-header">
          <span className="app-page-kicker">{t('calendar.kicker')}</span>
          <h1 className="app-page-title">{t('calendar.title')}</h1>
          <p className="app-page-subtitle">{t('calendar.subtitle')}</p>
          <div className="flex items-center gap-2">
            <ContextBadge context={currentContext} companyName={currentCompany?.name} />
          </div>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          {t('calendar.newEvent')}
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="app-panel flex items-center justify-between rounded-[1.75rem] p-3 sm:p-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-0 text-center text-base font-semibold capitalize tracking-[-0.02em] text-[#231b18] sm:text-lg">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          {t('calendar.today')}
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="app-panel">
        <CardContent className="p-2 sm:p-4">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="py-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#8c766e] sm:py-2 sm:text-sm sm:tracking-[0.1em]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[60px] cursor-pointer rounded-[1rem] border p-1 transition-colors sm:min-h-[100px] sm:p-2
                    ${isCurrentMonth ? 'bg-[rgba(255,250,247,0.9)]' : 'bg-[rgba(240,232,226,0.7)]'}
                    ${isToday ? 'border-[#d9553a]' : 'border-[rgba(197,177,165,0.44)]'}
                    ${isSelected ? 'ring-2 ring-[#d9553a]/40' : ''}
                    hover:bg-[rgba(248,241,237,0.95)]
                  `}
                >
                  <div className={`
                    text-xs sm:text-sm font-medium mb-0.5 sm:mb-1
                    ${isToday ? 'text-[#d9553a]' : isCurrentMonth ? 'text-[#231b18]' : 'text-[#9a867f]'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  {/* Mobile: just show dots */}
                  <div className="hidden sm:block space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          if (event.entry_type === 'event') {
                            handleEventClick(event, e);
                          } else {
                            handleTaskClick(event, e);
                          }
                        }}
                        className={`text-xs p-1 rounded truncate ${
                          event.entry_type === 'task'
                            ? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200'
                            : 'bg-[rgba(239,97,68,0.12)] text-[#d9553a] hover:bg-[rgba(239,97,68,0.18)] cursor-pointer'
                        }`}
                      >
                        {event.entry_type === 'task'
                          ? `${currentLanguage === 'it' ? 'Attività' : 'Task'}: ${event.title} ${event.project_name ? `• ${event.project_name}` : ''}`
                          : `${format(new Date(event.start_datetime), 'HH:mm')} ${event.title}`}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} {currentLanguage === 'it' ? 'altri' : 'more'}
                      </div>
                    )}
                  </div>
                  {/* Mobile: compact dots */}
                  <div className="flex gap-0.5 flex-wrap sm:hidden">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`h-1.5 w-1.5 rounded-full ${event.entry_type === 'task' ? 'bg-blue-500' : 'bg-[#d9553a]'}`}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail view */}
      {selectedDate && (
        <CalendarDayView
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setEventDetailOpen(true);
          }}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setTaskDetailOpen(true);
          }}
          onClose={() => setSelectedDate(null)}
          onCreateEvent={() => {
            setSelectedEvent(null);
            setEventDialogOpen(true);
          }}
        />
      )}

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        defaultDate={selectedDate}
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