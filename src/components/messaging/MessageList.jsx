import React, { useEffect, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { User, Building2, Flag, CheckCircle2, DollarSign, FileText } from "lucide-react";
import DocumentPreviewDialog from '@/components/project/DocumentPreviewDialog';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function MessageList({ 
  channelId, 
  projectId,
  companyId,
  scopeType = 'project',
  currentUserEmail,
  focusedMessageId,
  onNavigate
}) {
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isCompanyScope = scopeType === 'company';
  const scopeId = isCompanyScope ? companyId : projectId;

  // Use scope-level messages and filter by channel for instant display
  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', scopeType, scopeId],
    queryFn: () => appClient.entities.Message.filter(
      isCompanyScope ? { company_id: companyId } : { project_id: projectId },
    ),
    enabled: !!scopeId,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  const messages = allMessages.filter(m => m.channel_id === channelId);
  const isLoading = false; // Messages are loaded at project level

  const { data: channelMember } = useQuery({
    queryKey: ['channelMember', channelId, currentUserEmail],
    queryFn: async () => {
      const members = await appClient.entities.ChannelMember.filter({ 
        channel_id: channelId,
        user_email: currentUserEmail
      });
      return members[0];
    },
    enabled: !!channelId && !!currentUserEmail,
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => appClient.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !isCompanyScope && !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  const lastUpdateRef = useRef(null);

  const updateReadMutation = useMutation({
    mutationFn: () => appClient.entities.ChannelMember.update(channelMember.id, {
      last_read_at: new Date().toISOString()
    }),
  });

  useEffect(() => {
    // Prevent multiple updates for same channel
    if (channelId === lastUpdateRef.current) return;
    
    if (messages.length > 0 && channelMember && !updateReadMutation.isPending) {
      lastUpdateRef.current = channelId;
      const timer = setTimeout(() => {
        updateReadMutation.mutate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [channelId, channelMember?.id]);



  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  const renderMention = (type, id, text) => {
    const icons = {
      task: <CheckCircle2 className="h-3 w-3" />,
      milestone: <Flag className="h-3 w-3" />,
      change_request: <DollarSign className="h-3 w-3" />,
      document: <FileText className="h-3 w-3" />,
      user: <User className="h-3 w-3" />
    };

    const handleDocumentClick = () => {
      if (type === 'document') {
        if (isCompanyScope) return;
        const doc = allDocuments.find(d => d.id === id);
        if (doc) {
          setSelectedDocument(doc);
          setPreviewOpen(true);
        }
      } else {
        onNavigate && onNavigate(type, id);
      }
    };

    return (
      <Badge 
        key={`${type}-${id}`}
        variant="outline" 
        className="inline-flex items-center gap-1 cursor-pointer bg-gray-100"
        onClick={handleDocumentClick}
      >
        {icons[type]}
        {text}
      </Badge>
    );
  };

  const parseMessageContent = (message) => {
    const parts = [];
    let lastIndex = 0;
    const content = message.content;

    // Parse mentions and document links
    const regex = /(@\[([^\]]+)\]\(([^:]+):([^)]+)\)|#\[([^\]]+)\]\(([^:]+):([^)]+)\))/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      if (match[2]) {
        // Mention format: @[text](type:id)
        const [, , text, type, id] = match;
        parts.push(renderMention(type, id, text));
      } else {
        // Document format: #[text](type:id)
        const [, , , , , text, type, id] = match;
        parts.push(renderMention(type, id, text));
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  useEffect(() => {
    if (focusedMessageId) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [sortedMessages]);

  useEffect(() => {
    if (!focusedMessageId) return;
    const node = messageRefs.current[focusedMessageId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.add('ring-2', 'ring-[#ef6144]/40');
    const timer = setTimeout(() => {
      node.classList.remove('ring-2', 'ring-[#ef6144]/40');
    }, 1800);
    return () => clearTimeout(timer);
  }, [focusedMessageId, sortedMessages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedMessages.map(message => {
          const isOwnMessage = message.sender_email === currentUserEmail;
          const resolvedSenderName = message.sender_name || getUserDisplayNameByEmail(message.sender_email, allUsers);
          const senderDisplay = message.sender_context_type === 'company' && message.sender_company_name
            ? `${message.sender_company_name} - ${resolvedSenderName}`
            : resolvedSenderName;

          return (
            <div key={message.id} ref={(element) => { messageRefs.current[message.id] = element; }} className={`flex gap-3 rounded-lg transition-all ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
              {!isOwnMessage && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.sender_context_type === 'company' ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Avatar>
              )}
              <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {!isOwnMessage && (
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="font-semibold text-xs text-gray-700">{senderDisplay}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(message.created_date), 'HH:mm', { locale: dateLocale })}
                    </span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  isOwnMessage 
                    ? 'bg-[#ef6144] text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-sm break-words whitespace-pre-wrap ${
                    isOwnMessage ? 'text-white' : 'text-gray-700'
                  }`}>
                    {parseMessageContent(message)}
                  </div>
                </div>
                {isOwnMessage && (
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {format(new Date(message.created_date), 'HH:mm', { locale: dateLocale })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DocumentPreviewDialog
        document={selectedDocument}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        allDocuments={allDocuments}
      />
    </>
  );
}