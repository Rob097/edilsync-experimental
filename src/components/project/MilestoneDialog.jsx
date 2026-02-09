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
    start_date: '',
    target_date: '',
    status: 'pending',
    completion_date: '',
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    mutationFn: async (deleteLinkedTasks) => {
      if (deleteLinkedTasks) {
        // Elimina tutte le attività collegate
        const linkedTasks = milestoneTasks;
        await Promise.all(linkedTasks.map(task => base44.entities.Task.delete(task.id)));
      } else {
        // Rimuovi solo il collegamento
        const linkedTasks = milestoneTasks;
        await Promise.all(linkedTasks.map(task => 
          base44.entities.Task.update(task.id, { milestone_id: null })
        ));
      }
      await base44.entities.Milestone.delete(milestone.id);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data inizio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
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

          {milestone && onViewTasks && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Attività collegate</div>
                {milestoneTasks.length > 0 && (
                  <Badge variant="outline">
                    {completedTasks}/{milestoneTasks.length} completate
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
                  ? `Vedi le ${milestoneTasks.length} attività` 
                  : 'Vedi attività'}
              </Button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
              <div className="text-sm font-medium text-red-900">
                Questa milestone ha {milestoneTasks.length} attività collegate. Cosa vuoi fare?
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
                  Rimuovi collegamento, mantieni attività
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
                  Elimina milestone e tutte le attività
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full"
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {milestone && !showDeleteConfirm && (
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