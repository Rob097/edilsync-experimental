import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    status: 'pending',
    completion_date: '',
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && !!milestone,
  });

  const milestoneTasks = milestone ? tasks.filter(t => t.milestone_id === milestone.id) : [];
  const completedTasks = milestoneTasks.filter(t => t.status === 'completed').length;

  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || '',
        description: milestone.description || '',
        target_date: milestone.target_date || '',
        status: milestone.status || 'pending',
        completion_date: milestone.completion_date || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        target_date: '',
        status: 'pending',
        completion_date: '',
      });
    }
  }, [milestone, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (milestone) {
        return await base44.entities.Milestone.update(milestone.id, data);
      } else {
        return await base44.entities.Milestone.create({
          ...data,
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
    mutationFn: async () => {
      await base44.entities.Milestone.delete(milestone.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones']);
      onOpenChange(false);
    },
  });

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
          <DialogTitle>{milestone ? 'Modifica Milestone' : 'Nuova Milestone'}</DialogTitle>
          <DialogDescription>
            {milestone ? 'Aggiorna i dettagli della milestone.' : 'Aggiungi un traguardo importante al progetto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Es. Demolizione completata"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Dettagli opzionali..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Data obiettivo</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => handleChange('target_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Stato</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="in_progress">In corso</SelectItem>
                <SelectItem value="completed">Completato</SelectItem>
                <SelectItem value="delayed">Ritardo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'completed' && (
            <div className="space-y-2">
              <Label htmlFor="completion_date">Data completamento</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleChange('completion_date', e.target.value)}
              />
            </div>
          )}

          {milestone && milestoneTasks.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Attività collegate</div>
                <Badge variant="outline">
                  {completedTasks}/{milestoneTasks.length} completate
                </Badge>
              </div>
              {onViewTasks && (
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
                  Vedi attività
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {milestone && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
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
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {milestone ? 'Salva' : 'Crea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}