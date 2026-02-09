import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import ChannelList from './ChannelList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ProjectMessaging({ 
  projectId,
  currentUser,
  activeCompanyId,
  participants,
  onNavigate
}) {
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [initialized, setInitialized] = useState(false);

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

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    staleTime: 5 * 60 * 1000, // 5 minuti
  });



  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      return await base44.entities.Channel.create(channelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channels', projectId]);
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (memberData) => {
      return await base44.entities.ChannelMember.create(memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channelMembers', projectId]);
    },
  });

  // Initialize channels
  useEffect(() => {
    if (!projectId || !currentUser || initialized) return;
    
    // Only initialize if we have loaded channels and confirmed general doesn't exist
    if (channelsLoading) return;
    
    const existingGeneral = channels.find(c => c.type === 'general' && c.project_id === projectId);
    if (existingGeneral) {
      setInitialized(true);
      return;
    }

    const initializeChannels = async () => {
      try {
        const generalChannel = await createChannelMutation.mutateAsync({
          project_id: projectId,
          name: 'Generale',
          type: 'general',
          created_by_email: currentUser.email,
        });

        // Add all participants to general channel (with delay to avoid rate limit)
        for (let i = 0; i < participants.length; i++) {
          const participant = participants[i];
          await createMemberMutation.mutateAsync({
            channel_id: generalChannel.id,
            project_id: projectId,
            participant_id: participant.id,
            user_email: participant.user_email,
            company_id: participant.company_id || null,
            last_read_at: new Date().toISOString(),
          });
          if (i < participants.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize channels:', error);
        setInitialized(true);
      }
    };

    initializeChannels();
  }, [projectId, currentUser, participants?.length, channelsLoading, initialized]);

  // Select first available channel
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      const myChannels = channels.filter(channel => {
        const membership = channelMembers.find(m =>
          m.channel_id === channel.id &&
          m.user_email === currentUser?.email &&
          (!activeCompanyId || m.company_id === activeCompanyId)
        );
        return !!membership;
      });

      if (myChannels.length > 0) {
        setSelectedChannelId(myChannels[0].id);
      }
    }
  }, [channels, channelMembers, selectedChannelId, currentUser, activeCompanyId]);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  if (!currentUser || channelsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
        <Card className="md:col-span-1 p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Card>
        <Card className="md:col-span-3 flex flex-col">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
      <Card className="md:col-span-1 p-4 overflow-y-auto">
        <ChannelList
          projectId={projectId}
          currentUserEmail={currentUser.email}
          activeCompanyId={activeCompanyId}
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
          participants={participants}
        />
      </Card>

      <Card className="md:col-span-3 flex flex-col overflow-hidden">
        {selectedChannel ? (
          <>
            <div className="border-b p-4">
              <h3 className="font-semibold">{selectedChannel.name}</h3>
              {selectedChannel.description && (
                <p className="text-sm text-gray-500 mt-1">{selectedChannel.description}</p>
              )}
            </div>
            <MessageList
              channelId={selectedChannelId}
              projectId={projectId}
              currentUserEmail={currentUser.email}
              onNavigate={onNavigate}
            />
            <MessageInput
              channelId={selectedChannelId}
              projectId={projectId}
              currentUserEmail={currentUser.email}
              currentUserName={currentUser.full_name}
              contextType={activeCompanyId ? 'company' : 'personal'}
              activeCompanyId={activeCompanyId}
              activeCompanyName={activeCompany?.name}
              participants={participants}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Seleziona un canale per iniziare
          </div>
        )}
      </Card>
    </div>
  );
}