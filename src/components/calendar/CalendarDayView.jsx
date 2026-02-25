import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { X, Plus, Clock, MapPin } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function CalendarDayView({ date, events, onEventClick, onTaskClick, onClose, onCreateEvent }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const sortedEvents = [...events].sort((a, b) => {
    const firstDate = a.entry_type === 'task' ? new Date(a.due_date) : new Date(a.start_datetime);
    const secondDate = b.entry_type === 'task' ? new Date(b.due_date) : new Date(b.start_datetime);
    return firstDate - secondDate;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">
          {format(date, "EEEE d MMMM yyyy", { locale: dateLocale })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreateEvent}>
            <Plus className="h-4 w-4 mr-1" />
            {tr('Nuovo', 'New')}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                onClick={() => {
                  if (event.entry_type === 'event') {
                    onEventClick(event);
                  } else {
                    onTaskClick?.(event);
                  }
                }}
                className="p-4 rounded-lg border bg-white transition-colors hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">
                      {event.entry_type === 'task' ? `${tr('Attività', 'Task')}: ${event.title}` : event.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {event.entry_type === 'task'
                            ? tr('Scadenza giornata', 'Due today')
                            : `${format(new Date(event.start_datetime), 'HH:mm')} - ${format(new Date(event.end_datetime), 'HH:mm')}`}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.entry_type === 'task' && event.project_name && (
                      <p className="text-sm text-gray-600 mt-2">
                        {tr('Progetto', 'Project')}: {event.project_name}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title={tr('Nessun evento', 'No events')}
            description={tr('Non ci sono eventi programmati per questo giorno.', 'There are no events scheduled for this day.')}
            actionLabel={tr('Crea evento', 'Create event')}
            onAction={onCreateEvent}
          />
        )}
      </CardContent>
    </Card>
  );
}