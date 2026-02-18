import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AtSign, Hash, Flag, DollarSign, Paperclip } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SelectDocumentDialog from './SelectDocumentDialog';

export default function MessageInput({ 
  channelId, 
  projectId,
  currentUserEmail,
  currentUserName,
  contextType,
  activeCompanyId,
  activeCompanyName,
  participants
}) {
  const { t, currentLanguage } = useLanguage();
  const tr = (it, en) => currentLanguage === 'it' ? it : en;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionType, setMentionType] = useState(null);
  const [selectDocumentOpen, setSelectDocumentOpen] = useState(false);
  const textareaRef = useRef(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'task',
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'milestone',
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => base44.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'change_request',
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'document',
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await base44.entities.Message.create(messageData);
      
      // Create notifications for mentioned users (in background, don't wait)
      if (messageData.mentioned_user_emails?.length > 0) {
        Promise.all([
          base44.entities.Channel.filter({ id: channelId }),
          base44.entities.Project.filter({ id: projectId })
        ]).then(([channels, projects]) => {
          const channel = channels[0];
          const project = projects[0];
          
          messageData.mentioned_user_emails.forEach(email => {
            if (email !== currentUserEmail) {
              base44.entities.Notification.create({
                user_email: email,
                type: 'message_mention',
                title: tr('Sei stato menzionato', 'You were mentioned'),
                message: tr(
                  `${messageData.sender_name} ti ha menzionato in "${channel?.name}" nel progetto "${project?.name}"`,
                  `${messageData.sender_name} mentioned you in "${channel?.name}" in project "${project?.name}"`
                ),
                related_event_id: msg.id,
                is_read: false
              }).catch(err => console.error('Failed to send notification:', err));
            }
          });
        }).catch(err => console.error('Failed to fetch channel/project:', err));
      }
      
      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', channelId]);
      queryClient.invalidateQueries(['notifications']);
      setMessage('');
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;

    const mentionedUsers = [];
    const mentionedTasks = [];
    const mentionedMilestones = [];
    const mentionedChangeRequests = [];

    // Extract mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      const [, , type, id] = match;
      if (type === 'user') mentionedUsers.push(id);
      else if (type === 'task') mentionedTasks.push(id);
      else if (type === 'milestone') mentionedMilestones.push(id);
      else if (type === 'change_request') mentionedChangeRequests.push(id);
    }

    // Extract document links (no need to track separately, just part of message content)

    sendMessageMutation.mutate({
      channel_id: channelId,
      project_id: projectId,
      content: message,
      sender_email: currentUserEmail,
      sender_name: currentUserName,
      sender_context_type: contextType,
      sender_company_id: contextType === 'company' ? activeCompanyId : null,
      sender_company_name: contextType === 'company' ? activeCompanyName : null,
      mentioned_user_emails: mentionedUsers,
      mentioned_task_ids: mentionedTasks,
      mentioned_milestone_ids: mentionedMilestones,
      mentioned_change_request_ids: mentionedChangeRequests,
    });
  };

  const insertMention = (type, item) => {
    let text, id;
    if (type === 'user') {
      text = item.user_email;
      id = item.user_email;
    } else if (type === 'task') {
      text = item.title;
      id = item.id;
    } else if (type === 'milestone') {
      text = item.title;
      id = item.id;
    } else if (type === 'change_request') {
      text = item.title;
      id = item.id;
    }

    const mention = `@[${text}](${type}:${id}) `;
    setMessage(prev => prev + mention);
    setShowMentions(false);
    setMentionType(null);
    textareaRef.current?.focus();
  };

  const getMentionItems = () => {
    if (mentionType === 'user') return participants;
    if (mentionType === 'task') return tasks;
    if (mentionType === 'milestone') return milestones;
    if (mentionType === 'change_request') return changeRequests;
    if (mentionType === 'document') return documents;
    return [];
  };

  const insertDocument = (doc) => {
    const link = `#[${doc.name}](document:${doc.id}) `;
    setMessage(prev => prev + link);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t p-4 bg-white">
      <div className="flex gap-2 mb-2">
        <Popover open={showMentions && mentionType === 'user'} onOpenChange={(open) => {
          setShowMentions(open);
          if (!open) setMentionType(null);
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMentionType('user');
                setShowMentions(true);
              }}
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="space-y-1">
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => insertMention('user', p)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {p.user_email}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={showMentions && mentionType === 'task'} onOpenChange={(open) => {
          setShowMentions(open);
          if (!open) setMentionType(null);
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMentionType('task');
                setShowMentions(true);
              }}
            >
              <Hash className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {tasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => insertMention('task', t)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={showMentions && mentionType === 'milestone'} onOpenChange={(open) => {
          setShowMentions(open);
          if (!open) setMentionType(null);
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMentionType('milestone');
                setShowMentions(true);
              }}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {milestones.map(m => (
                <button
                  key={m.id}
                  onClick={() => insertMention('milestone', m)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {m.title}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={showMentions && mentionType === 'change_request'} onOpenChange={(open) => {
          setShowMentions(open);
          if (!open) setMentionType(null);
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMentionType('change_request');
                setShowMentions(true);
              }}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {changeRequests.map(cr => (
                <button
                  key={cr.id}
                  onClick={() => insertMention('change_request', cr)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {cr.title}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectDocumentOpen(true)}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messageInput.placeholder')}
          className="resize-none"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="bg-[#ef6144] hover:bg-[#d9553a]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <SelectDocumentDialog
        projectId={projectId}
        open={selectDocumentOpen}
        onOpenChange={setSelectDocumentOpen}
        onSelectDocument={insertDocument}
      />
    </div>
  );
}