import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', projectId],
    queryFn: () => base44.entities.Channel.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: channelMembers = [] } = useQuery({
    queryKey: ['channelMembers', projectId],
    queryFn: () => base44.entities.ChannelMember.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
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
    if (!projectId || !currentUser || initialized || channels.length > 0) return;

    const initializeChannels = async () => {
      // Create general channel
      const generalChannel = await createChannelMutation.mutateAsync({
        project_id: projectId,
        name: 'Generale',
        type: 'general',
        created_by_email: currentUser.email,
      });

      // Add all participants to general channel
      for (const participant of participants) {
        await createMemberMutation.mutateAsync({
          channel_id: generalChannel.id,
          project_id: projectId,
          participant_id: participant.id,
          user_email: participant.user_email,
          company_id: participant.company_id || null,
          last_read_at: new Date().toISOString(),
        });
      }

      // Create company channels for each company
      const companyIds = [...new Set(participants.filter(p => p.company_id).map(p => p.company_id))];
      for (const companyId of companyIds) {
        const company = companies.find(c => c.id === companyId);
        const companyChannel = await createChannelMutation.mutateAsync({
          project_id: projectId,
          name: company?.name || 'Azienda',
          type: 'company',
          company_id: companyId,
          created_by_email: currentUser.email,
        });

        // Add company members
        const companyParticipants = participants.filter(p => p.company_id === companyId);
        for (const participant of companyParticipants) {
          await createMemberMutation.mutateAsync({
            channel_id: companyChannel.id,
            project_id: projectId,
            participant_id: participant.id,
            user_email: participant.user_email,
            company_id: companyId,
            last_read_at: new Date().toISOString(),
          });
        }
      }

      // Create direct message channels for each participant
      const currentParticipant = participants.find(p => p.user_email === currentUser.email);
      for (const participant of participants) {
        if (participant.id === currentParticipant?.id) continue;

        const existingDM = channels.find(c =>
          c.type === 'direct' &&
          c.participant_ids?.includes(currentParticipant.id) &&
          c.participant_ids?.includes(participant.id)
        );

        if (!existingDM) {
          const dmName = participant.company_id
            ? `${companies.find(c => c.id === participant.company_id)?.name || 'Azienda'}`
            : participant.user_email;

          const dmChannel = await createChannelMutation.mutateAsync({
            project_id: projectId,
            name: dmName,
            type: 'direct',
            is_direct: true,
            participant_ids: [currentParticipant.id, participant.id],
            created_by_email: currentUser.email,
          });

          await createMemberMutation.mutateAsync({
            channel_id: dmChannel.id,
            project_id: projectId,
            participant_id: currentParticipant.id,
            user_email: currentUser.email,
            company_id: currentParticipant.company_id || null,
            last_read_at: new Date().toISOString(),
          });

          await createMemberMutation.mutateAsync({
            channel_id: dmChannel.id,
            project_id: projectId,
            participant_id: participant.id,
            user_email: participant.user_email,
            company_id: participant.company_id || null,
            last_read_at: new Date().toISOString(),
          });
        }
      }

      setInitialized(true);
    };

    initializeChannels();
  }, [projectId, currentUser, participants, channels, initialized]);

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

  if (!currentUser) {
    return <Skeleton className="h-96 w-full" />;
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