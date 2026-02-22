import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus } from 'lucide-react';
import EventDialog from '@/components/calendar/EventDialog';
import EventDetailDialog from '@/components/calendar/EventDetailDialog';
import { useEssentialData } from '@/essential/useEssentialData';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function EssentialCalendar() {
  const { currentLanguage } = useLanguage();
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [filter, setFilter] = useState('upcoming');
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    user,
    companyMemberships,
    currentContext,
    currentCompany,
    contextEvents,
  } = useEssentialData();

  const sortedEvents = useMemo(() => [...contextEvents]
    .sort((first, second) => new Date(first.start_datetime) - new Date(second.start_datetime)), [contextEvents]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayKey = format(now, 'yyyy-MM-dd');

    if (filter === 'today') {
      return sortedEvents.filter((event) => format(new Date(event.start_datetime), 'yyyy-MM-dd') === todayKey);
    }

    if (filter === 'past') {
      return sortedEvents.filter((event) => new Date(event.start_datetime) < now).reverse();
    }

    return sortedEvents.filter((event) => new Date(event.start_datetime) >= now);
  }, [sortedEvents, filter]);

  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((accumulator, event) => {
      const dayKey = format(new Date(event.start_datetime), 'yyyy-MM-dd');
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
          <CardTitle className="text-xl">Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => {
              setSelectedEvent(null);
              setEventDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Crea nuovo evento
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button className={filter === 'today' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'today' ? 'default' : 'outline'} onClick={() => setFilter('today')}>Oggi</Button>
              <Button className={filter === 'upcoming' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>Prossimi</Button>
              <Button className={filter === 'past' ? 'bg-[#ef6144] hover:bg-[#d9553a] text-white' : 'border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10'} variant={filter === 'past' ? 'default' : 'outline'} onClick={() => setFilter('past')}>Passati</Button>
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
                  setSelectedEvent(event);
                  setEventDetailOpen(true);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(event.start_datetime), 'HH:mm', { locale: dateLocale })}
                    </p>
                    {event.location ? <p className="text-sm text-gray-600">{event.location}</p> : null}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
                    <CalendarClock className="h-4 w-4 text-[#ef6144]" />
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
            Nessun evento disponibile per questo filtro.
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
    </div>
  );
}
