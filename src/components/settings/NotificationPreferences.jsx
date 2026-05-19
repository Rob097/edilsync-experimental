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
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_GROUPS,
  mergeNotificationPreferences,
} from '@/lib/notificationPreferences';

export default function NotificationPreferences({ userEmail }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

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
      setPreferences(mergeNotificationPreferences(userPrefs.preferences));
    } else {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
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
      toast.success(t('notificationPreferences.saveSuccess'));
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
        <CardTitle>{t('notificationPreferences.title')}</CardTitle>
        <CardDescription>
          {t('notificationPreferences.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">{t('notificationPreferences.allCommunications')}</Label>
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
                <span className="text-sm text-gray-700">{t('notificationPreferences.email')}</span>
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
        {NOTIFICATION_PREFERENCE_GROUPS.map(({ groupKey, actions }, groupIndex) => (
          <div key={groupKey} className="space-y-4">
            <h3 className="font-semibold text-gray-900">{t(`notificationPreferences.groups.${groupKey}`)}</h3>
            <div className="space-y-3">
              {actions.map(({ key }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <Label className="text-sm text-gray-700 flex-1">{t(`notificationPreferences.actions.${key}`)}</Label>
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
            {groupIndex !== NOTIFICATION_PREFERENCE_GROUPS.length - 1 && (
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
            {t('notificationPreferences.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}