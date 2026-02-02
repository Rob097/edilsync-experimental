import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { X, Plus, Clock, MapPin } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';

export default function CalendarDayView({ date, events, onEventClick, onClose, onCreateEvent }) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start_datetime) - new Date(b.start_datetime)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">
          {format(date, "EEEE d MMMM yyyy", { locale: it })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreateEvent}>
            <Plus className="h-4 w-4 mr-1" />
            Nuovo
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
                onClick={() => onEventClick(event)}
                className="p-4 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
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
            title="Nessun evento"
            description="Non ci sono eventi programmati per questo giorno."
            actionLabel="Crea evento"
            onAction={onCreateEvent}
          />
        )}
      </CardContent>
    </Card>
  );
}