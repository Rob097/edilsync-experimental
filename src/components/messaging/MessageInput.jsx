import React, { useState, useRef } from 'react';
import { appClient } from '@/api/appClient';
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
  companyId,
  currentUserEmail,
  currentUserName,
  contextType,
  activeCompanyId,
  activeCompanyName,
  participants,
  scopeType = 'project',
}) {
  const { t, currentLanguage } = useLanguage();
  const tr = (it, en) => currentLanguage === 'it' ? it : en;
  const queryClient = useQueryClient();
  const isCompanyScope = scopeType === 'company';
  const scopeId = isCompanyScope ? companyId : projectId;
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionType, setMentionType] = useState(null);
  const [selectDocumentOpen, setSelectDocumentOpen] = useState(false);
  const textareaRef = useRef(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !isCompanyScope && !!projectId && mentionType === 'task',
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }),
    enabled: !isCompanyScope && !!projectId && mentionType === 'milestone',
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !isCompanyScope && !!projectId && mentionType === 'change_request',
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', scopeType, scopeId],
    queryFn: () => appClient.entities.ProjectDocument.filter(
      isCompanyScope ? { company_id: companyId } : { project_id: projectId },
    ),
    enabled: !!scopeId && mentionType === 'document',
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: mentionType === 'user',
    staleTime: 5 * 60 * 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await appClient.entities.Message.create(messageData);
      
      // Create notifications for mentioned users (in background, don't wait)
      if (messageData.mentioned_user_emails?.length > 0) {
        Promise.all([
          appClient.entities.Channel.filter({ id: channelId }),
          !isCompanyScope && projectId ? appClient.entities.Project.filter({ id: projectId }) : Promise.resolve([]),
        ]).then(([channels, projects]) => {
          const channel = channels[0];
          const project = projects[0];
          
          messageData.mentioned_user_emails.forEach(email => {
            if (email !== currentUserEmail) {
              appClient.entities.Notification.create({
                user_email: email,
                context_type: contextType || 'personal',
                context_company_id: contextType === 'company' ? activeCompanyId : null,
                type: 'message_mention',
                title: tr('Sei stato menzionato', 'You were mentioned'),
                message: tr(
                  isCompanyScope
                    ? `${messageData.sender_name} ti ha menzionato in "${channel?.name}" nella società "${activeCompanyName || ''}"`
                    : `${messageData.sender_name} ti ha menzionato in "${channel?.name}" nel progetto "${project?.name}"`,
                  isCompanyScope
                    ? `${messageData.sender_name} mentioned you in "${channel?.name}" in company "${activeCompanyName || ''}"`
                    : `${messageData.sender_name} mentioned you in "${channel?.name}" in project "${project?.name}"`
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
      queryClient.invalidateQueries({ queryKey: ['messages', scopeType, scopeId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      project_id: isCompanyScope ? null : projectId,
      company_id: isCompanyScope ? companyId : null,
      content: message,
      sender_email: currentUserEmail,
      sender_name: currentUserName || currentUserEmail || 'Utente',
      sender_context_type: contextType || 'personal',
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
      text = item.full_name || item.display_name || item.user_email;
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
    if (!isCompanyScope && mentionType === 'task') return tasks;
    if (!isCompanyScope && mentionType === 'milestone') return milestones;
    if (!isCompanyScope && mentionType === 'change_request') return changeRequests;
    if (mentionType === 'document') return documents;
    return [];
  };

  const mentionableUsers = participants
    .filter((participant) => !!participant.user_email && participant.user_email !== currentUserEmail)
    .map((participant) => {
      const user = allUsers.find((u) => u.email === participant.user_email);
      return {
        ...participant,
          display_name: user?.full_name || user?.display_name || participant.user_email,
      };
    });

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
              {mentionableUsers.length > 0 ? (
                mentionableUsers.map((userItem) => (
                  <button
                    key={userItem.id}
                    onClick={() => insertMention('user', userItem)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {userItem.display_name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  {tr('Nessun utente presente', 'No users available')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {!isCompanyScope && (
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
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => insertMention('task', task)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {task.title}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  {tr('Nessun attività presente', 'No task available')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        )}

        {!isCompanyScope && (
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
              {milestones.length > 0 ? (
                milestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    onClick={() => insertMention('milestone', milestone)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {milestone.title}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  {tr('Nessuna Milestone presente', 'No milestone available')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        )}

        {!isCompanyScope && (
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
              {changeRequests.length > 0 ? (
                changeRequests.map((changeRequest) => (
                  <button
                    key={changeRequest.id}
                    onClick={() => insertMention('change_request', changeRequest)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {changeRequest.title}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  {tr('Nessuna richiesta presente', 'No request available')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        )}

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
        companyId={companyId}
        scopeType={scopeType}
        open={selectDocumentOpen}
        onOpenChange={setSelectDocumentOpen}
        onSelectDocument={insertDocument}
      />
    </div>
  );
}