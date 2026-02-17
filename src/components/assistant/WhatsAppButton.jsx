import React from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhatsAppButton() {
  const whatsappURL = base44.agents.getWhatsAppConnectURL('edilsync_assistant');

  return (
    <a 
      href={whatsappURL} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block"
    >
      <Button
        variant="ghost"
        size="icon"
        className="text-green-600 hover:bg-green-50 hover:text-green-700"
        title="Apri con WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </a>
  );
}