import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Button } from '@/components/ui/button';
import { Menu, Users } from 'lucide-react';
import ChannelList from './ChannelList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChannelMembersDialog from './ChannelMembersDialog';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ProjectMessaging({
  projectId,
  companyId,
  companyName,
  currentUser,
  activeCompanyId,
  participants = [],
  onNavigate,
  canCreateChannels = true,
}) {
  const { currentLanguage, t } = useLanguage();
  const tr = (it, en) => (currentLanguage === 'it' ? it : en);
  const queryClient = useQueryClient();
  const isCompanyScope = !projectId && !!companyId;
  const scopeType = isCompanyScope ? 'company' : 'project';
  const scopeId = isCompanyScope ? companyId : projectId;

  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['channels', scopeType, scopeId],
    queryFn: () => appClient.entities.Channel.filter(
      isCompanyScope ? { company_id: companyId } : { project_id: projectId },
    ),
    enabled: !!scopeId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: channelMembers = [] } = useQuery({
    queryKey: ['channelMembers', scopeType, scopeId],
    queryFn: () => appClient.entities.ChannelMember.filter(
      isCompanyScope ? { company_id: companyId } : { project_id: projectId },
    ),
    enabled: !!scopeId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    enabled: !isCompanyScope,
    staleTime: 5 * 60 * 1000,
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => appClient.entities.Channel.create(channelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', scopeType, scopeId] });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (memberData) => appClient.entities.ChannelMember.create(memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelMembers', scopeType, scopeId] });
    },
  });

  useEffect(() => {
    if (!scopeId || !currentUser || initialized || channelsLoading) return;

    const existingGeneral = channels.find((channel) => {
      if (isCompanyScope) {
        return channel.type === 'company' && channel.company_id === companyId;
      }
      return channel.type === 'general' && channel.project_id === projectId;
    });

    if (existingGeneral) {
      setInitialized(true);
      return;
    }

    const initializeChannels = async () => {
      try {
        const generalChannel = await createChannelMutation.mutateAsync({
          project_id: isCompanyScope ? null : projectId,
          company_id: isCompanyScope ? companyId : null,
          name: isCompanyScope ? (companyName || tr('Generale', 'General')) : t('messages.general'),
          type: isCompanyScope ? 'company' : 'general',
          description: isCompanyScope ? tr('Canale generale società', 'Company general channel') : null,
          created_by_email: currentUser.email,
        });

        for (let i = 0; i < participants.length; i += 1) {
          const participant = participants[i];
          await createMemberMutation.mutateAsync({
            channel_id: generalChannel.id,
            project_id: isCompanyScope ? null : projectId,
            participant_id: participant.id,
            user_email: participant.user_email,
            company_id: isCompanyScope ? companyId : (participant.company_id || null),
            last_read_at: new Date().toISOString(),
          });
          if (i < participants.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize channels:', error);
        setInitialized(true);
      }
    };

    initializeChannels();
  }, [
    scopeId,
    currentUser,
    initialized,
    channelsLoading,
    channels,
    isCompanyScope,
    companyId,
    projectId,
    createChannelMutation,
    createMemberMutation,
    participants,
    companyName,
    t,
    tr,
  ]);

  useEffect(() => {
    if (selectedChannelId || channels.length === 0) return;

    const myChannels = channels.filter((channel) => {
      const membership = channelMembers.find((member) => {
        if (member.channel_id !== channel.id) return false;
        if (member.user_email === currentUser?.email) return true;
        if (isCompanyScope && member.company_id === companyId) return true;
        if (!isCompanyScope && activeCompanyId && member.company_id === activeCompanyId) return true;
        return false;
      });
      return !!membership;
    });

    if (myChannels.length > 0) {
      setSelectedChannelId(myChannels[0].id);
    }
  }, [selectedChannelId, channels, channelMembers, currentUser, isCompanyScope, companyId, activeCompanyId]);

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId);
  const activeCompany = isCompanyScope
    ? { id: companyId, name: companyName }
    : companies.find((company) => company.id === activeCompanyId);

  if (!currentUser || channelsLoading) {
    return (
      <Card className="flex flex-col h-[80vh] md:h-[600px]">
        <Skeleton className="h-full w-full" />
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-[80vh] md:h-[600px]">
      <Card className="hidden md:flex md:col-span-1 p-4 overflow-y-auto w-64">
        <ChannelList
          scopeType={scopeType}
          scopeId={scopeId}
          projectId={projectId}
          companyId={companyId}
          currentUserEmail={currentUser.email}
          activeCompanyId={activeCompanyId}
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
          participants={participants}
          canCreateChannels={canCreateChannels}
        />
      </Card>

      <div className="relative flex-1 min-w-0">
        <Card className="flex-1 h-full flex flex-col overflow-hidden">
          <div className="border-b p-3 flex items-center justify-between md:hidden">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">
                {selectedChannel?.name || tr('Canali', 'Channels')}
              </h3>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {selectedChannel && !isCompanyScope && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMembersDialogOpen(true)}
                  title={tr('Membri del canale', 'Channel members')}
                >
                  <Users className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {selectedChannel ? (
            <>
              <div className="hidden md:flex border-b p-4 items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedChannel.name}</h3>
                  {selectedChannel.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedChannel.description}</p>
                  )}
                </div>
                {!isCompanyScope && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMembersDialogOpen(true)}
                      title={tr('Membri del canale', 'Channel members')}
                    >
                      <Users className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              <MessageList
                channelId={selectedChannelId}
                projectId={projectId}
                companyId={companyId}
                scopeType={scopeType}
                currentUserEmail={currentUser.email}
                onNavigate={onNavigate}
              />
              <MessageInput
                channelId={selectedChannelId}
                projectId={projectId}
                companyId={companyId}
                currentUserEmail={currentUser.email}
                currentUserName={currentUser.full_name}
                contextType={isCompanyScope ? 'company' : (activeCompanyId ? 'company' : 'personal')}
                activeCompanyId={isCompanyScope ? companyId : activeCompanyId}
                activeCompanyName={activeCompany?.name}
                participants={participants}
                scopeType={scopeType}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 px-4 text-center">
              {tr('Seleziona un canale per iniziare', 'Select a channel to start')}
            </div>
          )}
        </Card>

        <div
          className={`absolute inset-y-0 left-0 z-20 w-64 bg-white border-r shadow-xl transform transition-transform duration-200 md:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 overflow-y-auto h-full">
            <ChannelList
              scopeType={scopeType}
              scopeId={scopeId}
              projectId={projectId}
              companyId={companyId}
              currentUserEmail={currentUser.email}
              activeCompanyId={activeCompanyId}
              selectedChannelId={selectedChannelId}
              onSelectChannel={(channelId) => {
                setSelectedChannelId(channelId);
                setSidebarOpen(false);
              }}
              participants={participants}
              canCreateChannels={canCreateChannels}
            />
          </div>
        </div>

        {sidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={tr('Chiudi lista canali', 'Close channels list')}
          />
        )}
      </div>

      {!isCompanyScope && (
        <ChannelMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          channelId={selectedChannelId}
          projectId={projectId}
          canManage={true}
        />
      )}
    </div>
  );
}
