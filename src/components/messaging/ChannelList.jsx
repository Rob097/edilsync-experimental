import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Hash, Building2, User, Plus, MessageCircle } from "lucide-react";
import CreateChannelDialog from './CreateChannelDialog';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ChannelList({ 
  scopeType = 'project',
  scopeId,
  projectId, 
  companyId,
  currentUserEmail,
  activeCompanyId,
  selectedChannelId,
  onSelectChannel,
  participants,
  canCreateChannels = true,
  channelAccessMode = 'full',
}) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_messaging_ChannelList.${key}`, options);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const effectiveProjectId = scopeType === 'project' ? (projectId || scopeId) : null;
  const effectiveCompanyId = scopeType === 'company' ? (companyId || scopeId) : activeCompanyId;
  const isCompanyScope = scopeType === 'company';

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['channels', scopeType, scopeId],
    queryFn: () => appClient.entities.Channel.filter(
      isCompanyScope ? { company_id: effectiveCompanyId } : { project_id: effectiveProjectId },
    ),
    enabled: !!scopeId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: channelMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['channelMembers', scopeType, scopeId],
    queryFn: () => appClient.entities.ChannelMember.filter(
      isCompanyScope ? { company_id: effectiveCompanyId } : { project_id: effectiveProjectId },
    ),
    enabled: !!scopeId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', scopeType, scopeId],
    queryFn: () => appClient.entities.Message.filter(
      isCompanyScope ? { company_id: effectiveCompanyId } : { project_id: effectiveProjectId },
    ),
    enabled: !!scopeId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const isLoading = channelsLoading;

  // Filter channels based on membership
  const myChannels = channels.filter(channel => {
    const membership = channelMembers.find(m => {
      if (m.channel_id !== channel.id) return false;
      // Match by user email
      if (m.user_email === currentUserEmail) return true;
      // Match by company id (for company participants)
      if (effectiveCompanyId && m.company_id === effectiveCompanyId) return true;
      return false;
    });
    return !!membership;
  });

  const accessibleChannels = myChannels.filter((channel) => {
    if (channelAccessMode !== 'general_only') return true;
    return isCompanyScope ? channel.type === 'company' : channel.type === 'general';
  });

  // Group channels by type
  const generalChannel = isCompanyScope
    ? accessibleChannels.find((c) => c.type === 'company')
    : accessibleChannels.find((c) => c.type === 'general');
  const companyChannel = !isCompanyScope
    ? accessibleChannels.find((c) => c.type === 'company' && c.company_id === activeCompanyId)
    : null;
  const directChannels = accessibleChannels.filter(c => c.type === 'direct');
  const customChannels = accessibleChannels.filter(c => c.type === 'custom');

  const getUnreadCount = (channelId) => {
    const membership = channelMembers.find(m => 
      m.channel_id === channelId && 
      m.user_email === currentUserEmail
    );
    if (!membership) return 0;
    
    const lastRead = membership.last_read_at ? new Date(membership.last_read_at) : new Date(0);
    return messages.filter(m => 
      m.channel_id === channelId && 
      new Date(m.created_date) > lastRead
    ).length;
  };

  const getDirectChannelName = (channel) => {
    const otherParticipantId = channel.participant_ids?.find(id => {
      const participant = participants.find(p => p.id === id);
      return participant?.user_email !== currentUserEmail;
    });
    const participant = participants.find(p => p.id === otherParticipantId);
    if (participant?.company_id) {
      const company = participants.find(p => p.company_id === participant.company_id);
      return channel.name;
    }
    return participant?.user_display_name || participant?.full_name || participant?.display_name || participant?.user_email || channel.name;
  };

  const renderChannel = (channel, icon) => {
    const unreadCount = getUnreadCount(channel.id);
    const isActive = selectedChannelId === channel.id;
    const displayName = channel.type === 'direct' ? getDirectChannelName(channel) : channel.name;

    return (
      <button
        key={channel.id}
        onClick={() => onSelectChannel(channel.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-[#ef6144] text-white' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-sm font-medium truncate">{displayName}</span>
        </div>
        {unreadCount > 0 && (
          <Badge 
            variant="secondary" 
            className={`${isActive ? 'bg-white text-[#ef6144]' : 'bg-[#ef6144] text-white'} ml-2`}
          >
            {unreadCount}
          </Badge>
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* General Channel */}
      {generalChannel && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
            {tx('k1')}
          </h3>
          {renderChannel(generalChannel, <Hash className="h-4 w-4" />)}
        </div>
      )}

      {/* Company Channel */}
      {companyChannel && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
            {tx('k2')}
          </h3>
          {renderChannel(companyChannel, <Building2 className="h-4 w-4" />)}
        </div>
      )}

      {/* Direct Messages */}
      {!isCompanyScope && directChannels.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
            {tx('k3')}
          </h3>
          <div className="space-y-1">
            {directChannels.map(channel => 
              renderChannel(channel, <User className="h-4 w-4" />)
            )}
          </div>
        </div>
      )}

      {/* Custom Channels */}
      {customChannels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              {tx('k4')}
            </h3>
            {canCreateChannels && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {customChannels.map(channel => 
              renderChannel(channel, <MessageCircle className="h-4 w-4" />)
            )}
          </div>
        </div>
      )}

      {/* Create Channel Button */}
      {canCreateChannels && channelAccessMode !== 'general_only' && customChannels.length === 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {tx('k5')}
        </Button>
      )}

      {canCreateChannels && channelAccessMode !== 'general_only' && (
        <CreateChannelDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          scopeType={scopeType}
          projectId={effectiveProjectId}
          companyId={effectiveCompanyId}
          participants={participants}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
}