import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

export default function EssentialMessagesSection({ projectId, currentUser, currentContext, activeCompanyId, activeCompanyName }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data: channels = [] } = useQuery({
    queryKey: ['essentialChannels', projectId],
    queryFn: () => appClient.entities.Channel.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const selectedChannel = useMemo(() => channels.find((channel) => channel.type === 'general') || channels[0] || null, [channels]);

  const { data: messages = [] } = useQuery({
    queryKey: ['essentialMessages', selectedChannel?.id],
    queryFn: () => appClient.entities.Message.filter({ channel_id: selectedChannel?.id }, '-created_date'),
    enabled: !!selectedChannel?.id,
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChannel?.id) return;
      await appClient.entities.Message.create({
        channel_id: selectedChannel.id,
        project_id: projectId,
        content: content.trim(),
        sender_email: currentUser?.email,
        sender_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email,
        sender_context_type: currentContext,
        sender_company_id: currentContext === 'company' ? activeCompanyId : null,
        sender_company_name: currentContext === 'company' ? activeCompanyName : null,
      });
    },
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['essentialMessages', selectedChannel?.id] });
    },
  });

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Messaggi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Scrivi un messaggio semplice"
            />
            <Button
              className="bg-[#ef6144] hover:bg-[#d9553a] text-white"
              onClick={() => sendMessageMutation.mutate()}
              disabled={sendMessageMutation.isPending || !content.trim() || !selectedChannel?.id}
            >
              {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {messages.map((message) => (
        <Card key={message.id} className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{message.sender_name}</p>
              <p className="text-xs text-gray-500">{new Date(message.created_date).toLocaleString()}</p>
            </div>
            <p className="mt-2 text-gray-800 break-words">{message.content}</p>
          </CardContent>
        </Card>
      ))}

      {!selectedChannel ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Canale non disponibile.</CardContent>
        </Card>
      ) : null}

      {selectedChannel && messages.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Nessun messaggio in questo canale.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
