import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import { hasInvalidProjectDateRange } from '@/lib/projectDateRange';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

export default function EditProjectDialog({ open, onOpenChange, project }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanyMemberships', user?.email],
    queryFn: () => appClient.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: projectParticipants = [] } = useQuery({
    queryKey: ['projectParticipants', project?.id],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: project.id }),
    enabled: !!project?.id,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        address: project.address || '',
        description: project.description || '',
        status: project.status || 'planning',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
      });
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data) => {
      // Security check: If user is participating as company, must be admin
      const userParticipation = projectParticipants.find(p => p.user_email === user?.email);
      if (userParticipation?.participant_type === 'company' && userParticipation?.company_id) {
        const membership = companyMemberships.find(m => m.company_id === userParticipation.company_id);
        if (!membership || membership.role !== 'admin') {
          throw new Error(t('editProjectDialog.permissionError'));
        }
      }
      
      return await appClient.entities.Project.update(project.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project']);
      queryClient.invalidateQueries(['projects']);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || t('editProjectDialog.saveError'));
    },
  });

  const hasInvalidDateRange = hasInvalidProjectDateRange(formData.start_date, formData.end_date);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (hasInvalidDateRange) {
      toast.error(t('editProjectDialog.invalidDateRange'));
      return;
    }

    updateProjectMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editProjectDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editProjectDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('editProjectDialog.projectName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('editProjectDialog.siteAddress')} *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('editProjectDialog.projectDescription')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editProjectDialog.status')}</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">{t('editProjectDialog.planning')}</SelectItem>
                <SelectItem value="in_progress">{t('editProjectDialog.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('editProjectDialog.completed')}</SelectItem>
                <SelectItem value="on_hold">{t('editProjectDialog.onHold')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('editProjectDialog.startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t('editProjectDialog.endDate')}</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                min={formData.start_date || undefined}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {hasInvalidDateRange ? (
            <p className="text-sm font-medium text-[#b54732]">{t('editProjectDialog.invalidDateRange')}</p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('editProjectDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('editProjectDialog.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}