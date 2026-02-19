import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, CheckCircle2 } from "lucide-react";

export default function MilestoneDialog({ open, onOpenChange, projectId, milestone, nextOrderIndex, onViewTasks }) {
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
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId }),
    enabled: !!projectId,
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    target_date: '',
    status: 'pending',
    completion_date: '',
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && !!milestone,
  });

  const milestoneTasks = milestone ? tasks.filter(t => t.milestone_id === milestone.id) : [];
  const completedTasks = milestoneTasks.filter(t => t.status === 'completed').length;

  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || '',
        description: milestone.description || '',
        start_date: milestone.start_date || '',
        target_date: milestone.target_date || '',
        status: milestone.status || 'pending',
        completion_date: milestone.completion_date || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_date: '',
        target_date: '',
        status: 'pending',
        completion_date: '',
      });
    }
    setShowDeleteConfirm(false);
  }, [milestone, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const normalizedData = {
        ...data,
        description: data.description || null,
        start_date: data.start_date || null,
        target_date: data.target_date || null,
        completion_date: data.completion_date || null,
      };

      // Security check: If user is participating as company, must be admin
      const userParticipation = projectParticipants.find(p => p.user_email === user?.email);
      if (userParticipation?.participant_type === 'company' && userParticipation?.company_id) {
        const membership = companyMemberships.find(m => m.company_id === userParticipation.company_id);
        if (!membership || membership.role !== 'admin') {
          throw new Error('Solo gli amministratori della società possono creare o modificare milestone');
        }
      }

      if (milestone) {
        return await appClient.entities.Milestone.update(milestone.id, normalizedData);
      } else {
        return await appClient.entities.Milestone.create({
          ...normalizedData,
          project_id: projectId,
          order_index: nextOrderIndex,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones']);
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (deleteLinkedTasks) => {
      if (deleteLinkedTasks) {
        // Elimina tutte le attività collegate
        const linkedTasks = milestoneTasks;
        await Promise.all(linkedTasks.map(task => appClient.entities.Task.delete(task.id)));
      } else {
        // Rimuovi solo il collegamento
        const linkedTasks = milestoneTasks;
        await Promise.all(linkedTasks.map(task => 
          appClient.entities.Task.update(task.id, { milestone_id: null })
        ));
      }
      await appClient.entities.Milestone.delete(milestone.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones']);
      queryClient.invalidateQueries(['tasks']);
      onOpenChange(false);
    },
  });
  
  const handleDelete = () => {
    if (milestoneTasks.length > 0) {
      setShowDeleteConfirm(true);
    } else {
      deleteMutation.mutate(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{milestone ? t('milestoneDialog.editTitle') : t('milestoneDialog.newTitle')}</DialogTitle>
          <DialogDescription>
            {milestone ? t('milestoneDialog.editDescription') : t('milestoneDialog.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('milestoneDialog.title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('milestoneDialog.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('milestoneDialog.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('milestoneDialog.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('milestoneDialog.startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_date">{t('milestoneDialog.targetDate')}</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => handleChange('target_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('milestoneDialog.status')}</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('milestoneDialog.pending')}</SelectItem>
                <SelectItem value="in_progress">{t('milestoneDialog.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('milestoneDialog.completed')}</SelectItem>
                <SelectItem value="delayed">{t('milestoneDialog.delayed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'completed' && (
            <div className="space-y-2">
              <Label htmlFor="completion_date">{t('milestoneDialog.completionDate')}</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleChange('completion_date', e.target.value)}
              />
            </div>
          )}

          {milestone && onViewTasks && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">{t('milestoneDialog.linkedTasks')}</div>
                {milestoneTasks.length > 0 && (
                  <Badge variant="outline">
                    {completedTasks}/{milestoneTasks.length} {t('milestoneDialog.completed_tasks')}
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onViewTasks(milestone.id);
                }}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {milestoneTasks.length > 0 
                  ? t('milestoneDialog.viewTasksCount', { count: milestoneTasks.length })
                  : t('milestoneDialog.viewTasks')}
              </Button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
              <div className="text-sm font-medium text-red-900">
                {t('milestoneDialog.deleteConfirmTitle', { count: milestoneTasks.length })}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate(false);
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full justify-start"
                >
                  {t('milestoneDialog.removeLink')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate(true);
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full justify-start"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {t('milestoneDialog.deleteAll')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full"
                >
                  {t('milestoneDialog.cancel')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {milestone && !showDeleteConfirm && milestone.created_by === user?.email && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('milestoneDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {milestone ? t('milestoneDialog.save') : t('milestoneDialog.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}