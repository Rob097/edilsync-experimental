import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function TaskDialog({ open, onOpenChange, task, projectId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    assigned_to_type: 'contractor',
    assigned_to_email: '',
    assigned_to_name: '',
    room_area: '',
    due_date: '',
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

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'not_started',
        assigned_to_type: task.assigned_to_type || 'contractor',
        assigned_to_email: task.assigned_to_email || '',
        assigned_to_name: task.assigned_to_name || '',
        room_area: task.room_area || '',
        due_date: task.due_date || '',
        blocked_reason: task.blocked_reason || '',
        blocked_by_email: task.blocked_by_email || '',
        blocked_by_name: task.blocked_by_name || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'not_started',
        assigned_to_type: 'contractor',
        assigned_to_email: '',
        assigned_to_name: '',
        room_area: '',
        due_date: '',
        blocked_reason: '',
        blocked_by_email: '',
        blocked_by_name: '',
      });
    }
  }, [task, open]);

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
    const data = {
      ...formData,
      project_id: projectId,
      blocked_date: formData.status === 'blocked' ? new Date().toISOString() : null,
    };
    saveMutation.mutate(data);
  };

  const isValid = formData.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Modifica Task' : 'Nuovo Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Es. Installare controsoffitto cucina"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrizione opzionale..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Stato</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Non iniziato</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="blocked">Bloccato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_area">Stanza/Area</Label>
              <Input
                id="room_area"
                value={formData.room_area}
                onChange={(e) => setFormData(prev => ({ ...prev, room_area: e.target.value }))}
                placeholder="Es. Cucina"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to_name">Assegnato a</Label>
            <Input
              id="assigned_to_name"
              value={formData.assigned_to_name}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to_name: e.target.value }))}
              placeholder="Nome persona o società"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data scadenza</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          {formData.status === 'blocked' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="blocked_reason">Motivo blocco *</Label>
                <Textarea
                  id="blocked_reason"
                  value={formData.blocked_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, blocked_reason: e.target.value }))}
                  placeholder="Es. In attesa di selezione materiali"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocked_by_name">Bloccato da</Label>
                <Input
                  id="blocked_by_name"
                  value={formData.blocked_by_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, blocked_by_name: e.target.value }))}
                  placeholder="Nome persona responsabile"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {task && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Elimina
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              type="submit"
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {task ? 'Salva' : 'Crea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}