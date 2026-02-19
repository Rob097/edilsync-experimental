import React, { useState, useEffect, useRef } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

export default function ProjectChat({ projectId }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['projectMessages', projectId],
    queryFn: () => appClient.entities.ProjectMessage.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!projectId,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => appClient.entities.ProjectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectMessages']);
      setMessage('');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMutation.mutate({
      project_id: projectId,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.display_name || user?.email,
      message: message.trim(),
    });
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-4">
        <CardTitle>{tr('Messaggi Progetto', 'Project Messages')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : sortedMessages.length > 0 ? (
            <>
              {sortedMessages.map(msg => {
                const isMe = msg.sender_email === user?.email;
                const senderName = msg.sender_name || getUserDisplayNameByEmail(msg.sender_email, allUsers);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      isMe ? 'bg-[#ef6144] text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-medium mb-1 opacity-75">{senderName}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                        {format(new Date(msg.created_date), 'HH:mm', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <EmptyState
              icon={Send}
              title={tr('Nessun messaggio', 'No messages')}
              description={tr('Inizia la conversazione inviando un messaggio.', 'Start the conversation by sending a message.')}
            />
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tr('Scrivi un messaggio...', 'Write a message...')}
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-[#ef6144] hover:bg-[#d9553a]"
            disabled={!message.trim() || sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}