import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import AssigneeSelector from './AssigneeSelector';

export default function TaskDialog({ open, onOpenChange, task, projectId }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    assigned_participant_id: '',
    room_area: '',
    due_date: '',
    milestone_id: '',
    blocked_reason: '',
    blocked_by_email: '',
    blocked_by_name: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userPublicProfiles'],
    queryFn: () => base44.entities.UserPublicProfile.list(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'not_started',
        assigned_participant_id: task.assigned_participant_id || '',
        room_area: task.room_area || '',
        due_date: task.due_date || '',
        milestone_id: task.milestone_id || '',
        blocked_reason: task.blocked_reason || '',
        blocked_by_email: task.blocked_by_email || '',
        blocked_by_name: task.blocked_by_name || '',
      });
    } else {
      // Set default assignee based on context
      let defaultAssignee = '';
      if (user?.active_context === 'personal') {
        // Find user's personal participation
        const userParticipation = participants.find(p => p.user_email === user?.email && p.participant_type === 'personal');
        defaultAssignee = userParticipation?.id || '';
      } else if (user?.active_context === 'company' && user?.active_company_id) {
        // Find company's participation
        const companyParticipation = participants.find(p => p.company_id === user?.active_company_id && p.participant_type === 'company');
        defaultAssignee = companyParticipation?.id || '';
      }

      setFormData({
        title: '',
        description: '',
        status: 'not_started',
        assigned_participant_id: defaultAssignee,
        room_area: '',
        due_date: '',
        milestone_id: '',
        blocked_reason: '',
        blocked_by_email: '',
        blocked_by_name: '',
      });
    }
  }, [task, open, user, participants]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (task) {
        return base44.entities.Task.update(task.id, data);
      } else {
        return base44.entities.Task.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find assignee details
    const assignee = participants.find(p => p.id === formData.assigned_participant_id);
    const assigneeProfile = userProfiles.find((profile) => profile.user_email === assignee?.user_email);
    
    const data = {
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assigned_participant_id: formData.assigned_participant_id,
      assigned_participant_type: assignee?.participant_type || 'personal',
      assigned_user_email: assignee?.participant_type === 'personal' ? assignee.user_email : null,
      assigned_user_name: assignee?.participant_type === 'personal'
        ? (assigneeProfile?.display_name || assigneeProfile?.full_name || assignee.user_email)
        : null,
      assigned_company_id: assignee?.participant_type === 'company' ? assignee.company_id : null,
      assigned_company_name: assignee?.participant_type === 'company' ? companies.find(c => c.id === assignee.company_id)?.name : null,
      room_area: formData.room_area,
      due_date: formData.due_date || null,
      milestone_id: formData.milestone_id || null,
      blocked_reason: formData.status === 'blocked' ? formData.blocked_reason : null,
      blocked_by_email: formData.status === 'blocked' ? formData.blocked_by_email : null,
      blocked_by_name: formData.status === 'blocked' ? formData.blocked_by_name : null,
      blocked_date: formData.status === 'blocked' ? new Date().toISOString() : null,
    };
    
    saveMutation.mutate(data);
  };

  const isValid = formData.title && formData.assigned_participant_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? t('taskDialog.editTitle') : t('taskDialog.newTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('taskDialog.title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('taskDialog.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('taskDialog.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('taskDialog.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('taskDialog.status')}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{t('taskDialog.notStarted')}</SelectItem>
                  <SelectItem value="in_progress">{t('taskDialog.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('taskDialog.completed')}</SelectItem>
                  <SelectItem value="blocked">{t('taskDialog.blocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_area">{t('taskDialog.roomArea')}</Label>
              <Input
                id="room_area"
                value={formData.room_area}
                onChange={(e) => setFormData(prev => ({ ...prev, room_area: e.target.value }))}
                placeholder={t('taskDialog.roomAreaPlaceholder')}
              />
            </div>
          </div>

          <AssigneeSelector
            participants={participants}
            companies={companies}
            value={formData.assigned_participant_id}
            onChange={(option) => setFormData(prev => ({ ...prev, assigned_participant_id: option.id }))}
          />

          <div className="space-y-2">
            <Label htmlFor="due_date">{t('taskDialog.dueDate')}</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone">{t('taskDialog.milestone')}</Label>
            <Select
              value={formData.milestone_id || 'none'}
              onValueChange={(v) => setFormData(prev => ({ ...prev, milestone_id: v === 'none' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('taskDialog.selectMilestone')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('taskDialog.noMilestone')}</SelectItem>
                {milestones.map(milestone => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'blocked' && (
             <>
               <div className="space-y-2">
                 <Label htmlFor="blocked_reason">{t('taskDialog.blockedReason')} *</Label>
                 <Textarea
                   id="blocked_reason"
                   value={formData.blocked_reason}
                   onChange={(e) => setFormData(prev => ({ ...prev, blocked_reason: e.target.value }))}
                   placeholder={t('taskDialog.blockedReasonPlaceholder')}
                   rows={2}
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="blocked_by_name">{t('taskDialog.blockedBy')}</Label>
                 <Input
                   id="blocked_by_name"
                   value={formData.blocked_by_name}
                   onChange={(e) => setFormData(prev => ({ ...prev, blocked_by_name: e.target.value }))}
                   placeholder={t('taskDialog.blockedByPlaceholder')}
                 />
               </div>
             </>
           )}

          <div className="flex gap-3 pt-2">
             {task && task.created_by === user?.email && (
               <Button
                 type="button"
                 variant="destructive"
                 onClick={() => deleteMutation.mutate()}
                 disabled={deleteMutation.isPending}
               >
                 {t('taskDialog.delete')}
               </Button>
             )}
             <div className="flex-1" />
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               {t('taskDialog.cancel')}
             </Button>
             <Button
               type="submit"
               className="bg-[#ef6144] hover:bg-[#d9553a]"
               disabled={!isValid || saveMutation.isPending}
             >
               {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {task ? t('taskDialog.save') : t('taskDialog.create')}
             </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}