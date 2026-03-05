import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from '@/components/i18n/useLanguage';

const DEFAULT_PREFERENCES = {
  project_invite: { notification: true, email: true },
  company_invite: { notification: true, email: true },
  task_assigned: { notification: true, email: false },
  task_status_changed: { notification: true, email: false },
  change_request_assigned: { notification: true, email: true },
  change_request_status_changed: { notification: true, email: false },
  milestone_status_changed: { notification: true, email: false },
  event_invite: { notification: true, email: true },
  event_updated: { notification: true, email: true },
  event_cancelled: { notification: true, email: true },
  message_mention: { notification: true, email: false },
  document_comment: { notification: true, email: false },
  dispute_opened: { notification: true, email: true },
  dispute_status_changed: { notification: true, email: true },
  dispute_commented: { notification: true, email: false },
};

const NOTIFICATION_GROUPS = [
  {
    group: { it: 'Gestione Progetti', en: 'Project Management' },
    actions: [
      { key: 'project_invite', label: { it: 'Invito a nuovo progetto', en: 'Invitation to a new project' } },
      { key: 'task_assigned', label: { it: 'Assegnazione task', en: 'Task assignment' } },
      { key: 'task_status_changed', label: { it: 'Cambio stato task', en: 'Task status change' } },
      { key: 'change_request_assigned', label: { it: 'Assegnazione richiesta di modifica', en: 'Change request assignment' } },
      { key: 'change_request_status_changed', label: { it: 'Cambio stato richiesta di modifica', en: 'Change request status change' } },
      { key: 'milestone_status_changed', label: { it: 'Cambio stato milestone', en: 'Milestone status change' } },
    ],
  },
  {
    group: { it: 'Gestione Società', en: 'Company Management' },
    actions: [
      { key: 'company_invite', label: { it: 'Invito a nuova società', en: 'Invitation to a new company' } },
    ],
  },
  {
    group: { it: 'Calendario ed Eventi', en: 'Calendar and Events' },
    actions: [
      { key: 'event_invite', label: { it: 'Invito ad evento', en: 'Invitation to event' } },
      { key: 'event_updated', label: { it: 'Evento aggiornato', en: 'Event updated' } },
      { key: 'event_cancelled', label: { it: 'Evento cancellato', en: 'Event cancelled' } },
    ],
  },
  {
    group: { it: 'Comunicazioni', en: 'Communications' },
    actions: [
      { key: 'message_mention', label: { it: 'Menzione in un messaggio', en: 'Mention in a message' } },
      { key: 'document_comment', label: { it: 'Commento su documento', en: 'Comment on a document' } },
    ],
  },
  {
    group: { it: 'Gestione Dispute', en: 'Dispute Management' },
    actions: [
      { key: 'dispute_opened', label: { it: 'Nuova disputa aperta', en: 'New dispute opened' } },
      { key: 'dispute_status_changed', label: { it: 'Cambio stato disputa', en: 'Dispute status changed' } },
      { key: 'dispute_commented', label: { it: 'Nuovo commento in disputa', en: 'New dispute comment' } },
    ],
  },
];

export default function NotificationPreferences({ userEmail }) {
  const { currentLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);

  const { data: userPrefs, isLoading } = useQuery({
    queryKey: ['notificationPreferences', userEmail],
    queryFn: async () => {
      const prefs = await appClient.entities.NotificationPreference.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  useEffect(() => {
    if (userPrefs) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(userPrefs.preferences || {}),
      });
    } else {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [userPrefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (userPrefs) {
        return appClient.entities.NotificationPreference.update(userPrefs.id, { preferences });
      } else {
        return appClient.entities.NotificationPreference.create({
          user_email: userEmail,
          preferences,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences', userEmail]);
      setHasChanges(false);
      toast.success(tr('Preferenze salvate con successo', 'Preferences saved successfully'));
    },
  });

  const handleToggle = (actionKey, type) => {
    setPreferences(prev => ({
      ...prev,
      [actionKey]: {
        ...prev[actionKey],
        [type]: !prev[actionKey][type],
      },
    }));
    setHasChanges(true);
  };

  const handleToggleAll = (type) => {
    const allEnabled = Object.values(preferences).every(pref => pref[type]);
    const newPreferences = {};
    
    Object.keys(preferences).forEach(key => {
      newPreferences[key] = {
        ...preferences[key],
        [type]: !allEnabled,
      };
    });
    
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const areAllEnabled = (type) => {
    return Object.values(preferences).every(pref => pref[type]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ef6144]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr('Preferenze di Comunicazione', 'Communication Preferences')}</CardTitle>
        <CardDescription>
          {tr('Scegli come vuoi ricevere le notifiche per ogni tipo di azione', 'Choose how you want to receive notifications for each action type')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">{tr('Tutte le comunicazioni', 'All communications')}</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{t('settings.notifications')}</span>
              </div>
              <Switch
                checked={areAllEnabled('notification')}
                onCheckedChange={() => handleToggleAll('notification')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Email</span>
              </div>
              <Switch
                checked={areAllEnabled('email')}
                onCheckedChange={() => handleToggleAll('email')}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Groups */}
        {NOTIFICATION_GROUPS.map(({ group, actions }, groupIndex) => (
          <div key={group.en} className="space-y-4">
            <h3 className="font-semibold text-gray-900">{currentLanguage === 'it' ? group.it : group.en}</h3>
            <div className="space-y-3">
              {actions.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <Label className="text-sm text-gray-700 flex-1">{currentLanguage === 'it' ? label.it : label.en}</Label>
                  <div className="flex items-center gap-6">
                    <Switch
                      checked={preferences[key]?.notification ?? false}
                      onCheckedChange={() => handleToggle(key, 'notification')}
                    />
                    <Switch
                      checked={preferences[key]?.email ?? false}
                      onCheckedChange={() => handleToggle(key, 'email')}
                    />
                  </div>
                </div>
              ))}
            </div>
            {groupIndex !== NOTIFICATION_GROUPS.length - 1 && (
              <Separator />
            )}
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => saveMutation.mutate()}
            className="bg-[#ef6144] hover:bg-[#d9553a]"
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {tr('Salva preferenze', 'Save preferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}