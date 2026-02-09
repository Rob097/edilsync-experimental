import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import ContextBadge from '@/components/context/ContextBadge';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import EventDialog from '@/components/calendar/EventDialog';
import EventDetailDialog from '@/components/calendar/EventDetailDialog';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60 * 1000,
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ status: 'scheduled' }),
    staleTime: 60 * 1000,
  });

  const { data: eventParticipants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['eventParticipants'],
    queryFn: () => base44.entities.EventParticipant.list(),
    enabled: events.length > 0,
    staleTime: 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

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

  // Calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return contextEvents.filter(event => {
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      const currentDate = new Date(format(day, 'yyyy-MM-dd'));
      
      // Check if the current date is within the event's date range
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

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  if (userLoading || eventsLoading || participantsLoading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">Visualizzazione</span>
            <ContextBadge context={currentContext} companyName={currentCompany?.name} />
          </div>
        </div>
        <Button onClick={handleCreateEvent} className="bg-[#ef6144] hover:bg-[#d9553a]">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Evento
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentDate(new Date())}
        >
          Oggi
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
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
                    min-h-[100px] p-2 rounded-lg border cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isToday ? 'border-[#ef6144]' : 'border-gray-200'}
                    ${isSelected ? 'ring-2 ring-[#ef6144]' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday ? 'text-[#ef6144]' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="text-xs p-1 rounded bg-[#ef6144]/10 text-[#ef6144] truncate hover:bg-[#ef6144]/20 cursor-pointer"
                      >
                        {format(new Date(event.start_datetime), 'HH:mm')} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} altri
                      </div>
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
    </div>
  );
}