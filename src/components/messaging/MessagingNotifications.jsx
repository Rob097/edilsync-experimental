import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function MessagingNotifications({ userEmail }) {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_messaging_MessagingNotifications.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const { data: channelMembers = [] } = useQuery({
    queryKey: ['allChannelMembers', userEmail],
    queryFn: () => appClient.entities.ChannelMember.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 30 * 1000,
  });

  const channelIds = channelMembers.map(m => m.channel_id);

  const { data: channels = [] } = useQuery({
    queryKey: ['userChannels', channelIds],
    queryFn: async () => {
      if (channelIds.length === 0) return [];
      const allChannels = await appClient.entities.Channel.list();
      return allChannels.filter(c => channelIds.includes(c.id));
    },
    enabled: channelIds.length > 0,
    staleTime: 30 * 1000,
  });

  const projectIds = [...new Set(channels.map(c => c.project_id))];

  const { data: messages = [] } = useQuery({
    queryKey: ['recentMessages', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const allMessages = await appClient.entities.Message.list('-created_date', 50);
      return allMessages.filter(m => projectIds.includes(m.project_id));
    },
    enabled: projectIds.length > 0,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['messagingProjects', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const allProjects = await appClient.entities.Project.list();
      return allProjects.filter(p => projectIds.includes(p.id));
    },
    enabled: projectIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Calculate unread messages per channel
  const unreadByChannel = channelMembers.reduce((acc, member) => {
    const lastRead = member.last_read_at ? new Date(member.last_read_at) : new Date(0);
    const unreadCount = messages.filter(m =>
      m.channel_id === member.channel_id &&
      new Date(m.created_date) > lastRead &&
      m.sender_email !== userEmail
    ).length;
    
    if (unreadCount > 0) {
      acc[member.channel_id] = unreadCount;
    }
    return acc;
  }, {});

  // Get channels with unread messages
  const unreadChannels = Object.keys(unreadByChannel).map(channelId => {
    const channel = channels.find(c => c.id === channelId);
    const project = projects.find(p => p.id === channel?.project_id);
    const lastMessage = messages
      .filter(m => m.channel_id === channelId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    return {
      channelId,
      channel,
      project,
      unreadCount: unreadByChannel[channelId],
      lastMessage,
    };
  }).filter(item => item.channel && item.project);

  // Get mentions
  const mentions = messages
    .filter(m => 
      m.mentioned_user_emails?.includes(userEmail) &&
      m.sender_email !== userEmail
    )
    .slice(0, 5)
    .map(m => {
      const channel = channels.find(c => c.id === m.channel_id);
      const project = projects.find(p => p.id === m.project_id);
      return { message: m, channel, project };
    })
    .filter(item => item.channel && item.project);

  const totalNotifications = unreadChannels.length + mentions.length;

  const handleNotificationClick = (projectId) => {
    navigate(createPageUrl('ProjectDetail') + `?id=${projectId}&tab=info&section=chat`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          {totalNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ef6144] text-white text-xs flex items-center justify-center">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">{tx('k1')}</h3>
        </div>

        {totalNotifications === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {tx('k2')}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {mentions.map((item, idx) => (
              <DropdownMenuItem
                key={`mention-${idx}`}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleNotificationClick(item.project.id)}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-medium text-[#ef6144]">
                    {tx('k3')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(item.message.created_date), { 
                      addSuffix: true,
                      locale: dateLocale 
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium truncate w-full">
                  {item.project.name} • {item.channel.name}
                </p>
                <p className="text-xs text-gray-600 truncate w-full">
                  {item.message.sender_name}: {item.message.content.substring(0, 50)}...
                </p>
              </DropdownMenuItem>
            ))}

            {unreadChannels.map((item) => (
              <DropdownMenuItem
                key={item.channelId}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleNotificationClick(item.project.id)}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Badge variant="secondary" className="bg-[#ef6144] text-white">
                    {item.unreadCount} {item.unreadCount === 1 ? tx('k4') : tx('k5')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(item.lastMessage.created_date), { 
                      addSuffix: true,
                      locale: dateLocale 
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium truncate w-full">
                  {item.project.name}
                </p>
                <p className="text-xs text-gray-600 truncate w-full">
                  {item.channel.name}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}