import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, ListTodo, Users } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function SuggestedMessages({ onSelectMessage }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_assistant_SuggestedMessages.${key}`, options);
  const suggestions = [
    {
      icon: ListTodo,
      text: tx('k1'),
    },
    {
      icon: Calendar,
      text: tx('k2'),
    },
    {
      icon: Users,
      text: tx('k3'),
    },
    {
      icon: MessageSquare,
      text: tx('k4'),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {tx('k5')}
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