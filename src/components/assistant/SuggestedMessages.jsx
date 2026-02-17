import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, ListTodo, Users } from "lucide-react";

const suggestions = [
  {
    icon: ListTodo,
    text: "Quali sono i miei progetti in corso?",
  },
  {
    icon: Calendar,
    text: "Mostrami gli eventi di questa settimana",
  },
  {
    icon: Users,
    text: "Chi sono i partecipanti del progetto X?",
  },
  {
    icon: MessageSquare,
    text: "Ci sono nuove notifiche importanti?",
  },
];

export default function SuggestedMessages({ onSelectMessage }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Suggerimenti
      </p>
      <div className="grid grid-cols-1 gap-2">
        {suggestions.map((suggestion, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="justify-start h-auto py-3 px-4 text-left hover:bg-[#ef6144]/5 hover:border-[#ef6144]/30 whitespace-normal"
            onClick={() => onSelectMessage(suggestion.text)}
          >
            <suggestion.icon className="h-4 w-4 mr-2 flex-shrink-0 text-[#ef6144]" />
            <span className="text-sm text-gray-700 line-clamp-2">{suggestion.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}