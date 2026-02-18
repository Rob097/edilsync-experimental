import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Hash, Building2, User, Plus, MessageCircle } from "lucide-react";
import CreateChannelDialog from './CreateChannelDialog';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ChannelList({ 
  projectId, 
  currentUserEmail,
  activeCompanyId,
  selectedChannelId,
  onSelectChannel,
  participants
}) {
  const { currentLanguage } = useLanguage();
  const tr = (it, en) => currentLanguage === 'it' ? it : en;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['channels', projectId],
    queryFn: () => base44.entities.Channel.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: channelMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['channelMembers', projectId],
    queryFn: () => base44.entities.ChannelMember.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => base44.entities.Message.filter({ project_id: projectId }),
    enabled: !!projectId,
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
      if (activeCompanyId && m.company_id === activeCompanyId) return true;
      return false;
    });
    return !!membership;
  });

  // Group channels by type
  const generalChannel = myChannels.find(c => c.type === 'general');
  const companyChannel = myChannels.find(c => c.type === 'company' && c.company_id === activeCompanyId);
  const directChannels = myChannels.filter(c => c.type === 'direct');
  const customChannels = myChannels.filter(c => c.type === 'custom');

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
    return participant?.user_email || channel.name;
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
            {tr('Canale Generale', 'General Channel')}
          </h3>
          {renderChannel(generalChannel, <Hash className="h-4 w-4" />)}
        </div>
      )}

      {/* Company Channel */}
      {companyChannel && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
            {tr('Canale Aziendale', 'Company Channel')}
          </h3>
          {renderChannel(companyChannel, <Building2 className="h-4 w-4" />)}
        </div>
      )}

      {/* Direct Messages */}
      {directChannels.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
            {tr('Messaggi Diretti', 'Direct Messages')}
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
              {tr('Canali', 'Channels')}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {customChannels.map(channel => 
              renderChannel(channel, <MessageCircle className="h-4 w-4" />)
            )}
          </div>
        </div>
      )}

      {/* Create Channel Button */}
      {customChannels.length === 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {tr('Crea Canale', 'Create Channel')}
        </Button>
      )}

      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        participants={participants}
        currentUserEmail={currentUserEmail}
        activeCompanyId={activeCompanyId}
      />
    </div>
  );
}