import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, User, Bell } from "lucide-react";
import { toast } from "sonner";
import NotificationPreferences from '@/components/settings/NotificationPreferences';

export default function Settings() {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || user.full_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return appClient.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setHasChanges(false);
      toast.success(t('settings.profileUpdated'));
      navigate(createPageUrl('Dashboard'));
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#d9553a]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="app-page-header">
        <span className="app-page-kicker">{t('settings.kicker')}</span>
        <h1 className="app-page-title">{t('settings.title')}</h1>
        <p className="app-page-subtitle">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.communications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="app-panel">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#ef6144,#d9553a)] shadow-[0_18px_36px_rgba(217,85,58,0.22)]">
                  <span className="text-white font-semibold text-lg">
                    {user?.full_name?.charAt(0)?.toUpperCase() || (currentLanguage === 'it' ? 'U' : 'U')}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-[#231b18]">{user?.full_name || tr('Utente', 'User')}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="display_name">{t('settings.fullName')}</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    placeholder={t('settings.fullNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-[rgba(240,232,226,0.7)]"
                  />
                  <p className="text-xs text-[#8c766e]">{t('settings.emailCannotBeChanged')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!hasChanges || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {t('settings.saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences userEmail={user?.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}