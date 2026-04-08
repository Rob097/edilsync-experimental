import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/appClient';
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
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import AssigneeSelector from './AssigneeSelector';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

export default function ChangeRequestDialog({ open, onOpenChange, request, projectId, canRespond }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost_impact: '',
    time_impact_days: '',
    assigned_participant_id: '',
    response_note: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: projectParticipants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || '',
        description: request.description || '',
        cost_impact: request.cost_impact || '',
        time_impact_days: request.time_impact_days || '',
        assigned_participant_id: request.assigned_participant_id || '',
        response_note: request.response_note || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        cost_impact: '',
        time_impact_days: '',
        assigned_participant_id: '',
        response_note: '',
      });
    }
  }, [request, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (request) {
        return appClient.entities.ChangeRequest.update(request.id, data);
      } else {
        // Security check: Only homeowner can create change request
        const userParticipation = projectParticipants.find(p => p.user_email === user?.email);
        if (!userParticipation || userParticipation.project_role !== 'homeowner') {
          throw new Error(t('changeRequestDialog.permissionError'));
        }

        return appClient.entities.ChangeRequest.create({
          ...data,
          project_id: projectId,
          status: 'pending',
          requested_by_email: user?.email,
          requested_by_name: user?.full_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests']);
      onOpenChange(false);
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ status, note }) => {
      return appClient.entities.ChangeRequest.update(request.id, {
        status,
        response_note: note,
        responded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['changeRequests']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find assignee details if assigned
    const assignee = formData.assigned_participant_id 
      ? projectParticipants.find(p => p.id === formData.assigned_participant_id)
      : null;
    const assignedUserName = assignee?.participant_type === 'personal'
      ? getUserDisplayNameByEmail(assignee.user_email, allUsers)
      : null;
    
    const data = {
      title: formData.title,
      description: formData.description,
      cost_impact: formData.cost_impact ? parseFloat(formData.cost_impact) : 0,
      time_impact_days: formData.time_impact_days ? parseInt(formData.time_impact_days) : 0,
      assigned_participant_id: formData.assigned_participant_id || null,
      assigned_participant_type: assignee?.participant_type || null,
      assigned_user_email: assignee?.participant_type === 'personal' ? assignee.user_email : null,
      assigned_user_name: assignedUserName,
      assigned_company_id: assignee?.participant_type === 'company' ? assignee.company_id : null,
      assigned_company_name: assignee?.participant_type === 'company' ? companies.find(c => c.id === assignee.company_id)?.name : null,
    };
    saveMutation.mutate(data);
  };

  const handleResponse = (status) => {
    respondMutation.mutate({ status, note: formData.response_note });
  };

  const isValid = formData.title && formData.description;
  const isPending = request?.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {request ? t('changeRequestDialog.editTitle') : t('changeRequestDialog.newTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('changeRequestDialog.title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('changeRequestDialog.titlePlaceholder')}
              required
              disabled={!!request}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('changeRequestDialog.description')} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('changeRequestDialog.descriptionPlaceholder')}
              rows={3}
              required
              disabled={!!request}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_impact">{t('changeRequestDialog.costImpact')}</Label>
              <Input
                id="cost_impact"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_impact}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_impact: e.target.value }))}
                placeholder={t('changeRequestDialog.costPlaceholder')}
                disabled={!!request}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_impact_days">{t('changeRequestDialog.timeImpact')}</Label>
              <Input
                id="time_impact_days"
                type="number"
                min="0"
                value={formData.time_impact_days}
                onChange={(e) => setFormData(prev => ({ ...prev, time_impact_days: e.target.value }))}
                placeholder={t('changeRequestDialog.timePlaceholder')}
                disabled={!!request}
              />
            </div>
          </div>

          {!request && (
             <AssigneeSelector
               participants={projectParticipants}
               companies={companies}
               allUsers={allUsers}
               value={formData.assigned_participant_id}
               onChange={(option) => setFormData(prev => ({ ...prev, assigned_participant_id: option?.id || '' }))}
               label={t('changeRequestDialog.assignTo')}
             />
           )}

          {request && canRespond && isPending && (
             <div className="space-y-2 pt-4 border-t">
               <Label htmlFor="response_note">{t('changeRequestDialog.response')}</Label>
               <Textarea
                 id="response_note"
                 value={formData.response_note}
                 onChange={(e) => setFormData(prev => ({ ...prev, response_note: e.target.value }))}
                 placeholder={t('changeRequestDialog.responsePlaceholder')}
                 rows={2}
               />
             </div>
           )}

          <div className="flex gap-3 pt-2">
             {request && canRespond && isPending ? (
               <>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => handleResponse('rejected')}
                   disabled={respondMutation.isPending}
                   className="flex-1"
                 >
                   <XCircle className="h-4 w-4 mr-2" />
                   {t('changeRequestDialog.reject')}
                 </Button>
                 <Button
                   type="button"
                   onClick={() => handleResponse('approved')}
                   disabled={respondMutation.isPending}
                   className="flex-1 bg-green-600 hover:bg-green-700"
                 >
                   {respondMutation.isPending ? (
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   ) : (
                     <CheckCircle2 className="h-4 w-4 mr-2" />
                   )}
                   {t('changeRequestDialog.approve')}
                 </Button>
               </>
             ) : (
               <>
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                   {request ? t('changeRequestDialog.close') : t('changeRequestDialog.cancel')}
                 </Button>
                 {!request && (
                   <Button
                     type="submit"
                     className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                     disabled={!isValid || saveMutation.isPending}
                   >
                     {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                     {t('changeRequestDialog.submit')}
                   </Button>
                 )}
               </>
             )}
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}