import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Mail, Check } from "lucide-react";
import { toast } from "sonner";

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
};

const NOTIFICATION_GROUPS = {
  'Gestione Progetti': [
    { key: 'project_invite', label: 'Invito a nuovo progetto' },
    { key: 'task_assigned', label: 'Assegnazione task' },
    { key: 'task_status_changed', label: 'Cambio stato task' },
    { key: 'change_request_assigned', label: 'Assegnazione richiesta di modifica' },
    { key: 'change_request_status_changed', label: 'Cambio stato richiesta di modifica' },
    { key: 'milestone_status_changed', label: 'Cambio stato milestone' },
  ],
  'Gestione Società': [
    { key: 'company_invite', label: 'Invito a nuova società' },
  ],
  'Calendario ed Eventi': [
    { key: 'event_invite', label: 'Invito ad evento' },
    { key: 'event_updated', label: 'Evento aggiornato' },
    { key: 'event_cancelled', label: 'Evento cancellato' },
  ],
  'Comunicazioni': [
    { key: 'message_mention', label: 'Menzione in un messaggio' },
    { key: 'document_comment', label: 'Commento su documento' },
  ],
};

export default function NotificationPreferences({ userEmail }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: userPrefs, isLoading } = useQuery({
    queryKey: ['notificationPreferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  useEffect(() => {
    if (userPrefs) {
      setPreferences(userPrefs.preferences);
    } else {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [userPrefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (userPrefs) {
        return base44.entities.NotificationPreference.update(userPrefs.id, { preferences });
      } else {
        return base44.entities.NotificationPreference.create({
          user_email: userEmail,
          preferences,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences', userEmail]);
      setHasChanges(false);
      toast.success('Preferenze salvate con successo');
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
        <CardTitle>Preferenze di Comunicazione</CardTitle>
        <CardDescription>
          Scegli come vuoi ricevere le notifiche per ogni tipo di azione
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">Tutte le comunicazioni</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Notifiche</span>
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
        {Object.entries(NOTIFICATION_GROUPS).map(([groupName, actions]) => (
          <div key={groupName} className="space-y-4">
            <h3 className="font-semibold text-gray-900">{groupName}</h3>
            <div className="space-y-3">
              {actions.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <Label className="text-sm text-gray-700 flex-1">{label}</Label>
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
            {groupName !== Object.keys(NOTIFICATION_GROUPS)[Object.keys(NOTIFICATION_GROUPS).length - 1] && (
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
            Salva preferenze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}