import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';

export default function ProjectChat({ projectId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['projectMessages', projectId],
    queryFn: () => base44.entities.ProjectMessage.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMessage.create(data),
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
      sender_name: user?.full_name,
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
        <CardTitle>Messaggi Progetto</CardTitle>
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
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      isMe ? 'bg-[#ef6144] text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-medium mb-1 opacity-75">{msg.sender_name}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                        {format(new Date(msg.created_date), 'HH:mm', { locale: it })}
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
              title="Nessun messaggio"
              description="Inizia la conversazione inviando un messaggio."
            />
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
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