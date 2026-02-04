import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function EditProjectDialog({ open, onOpenChange, project }) {
  const queryClient = useQueryClient();
  
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
      return await base44.entities.Project.update(project.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project']);
      queryClient.invalidateQueries(['projects']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProjectMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Progetto</DialogTitle>
          <DialogDescription>
            Aggiorna le informazioni del progetto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome del progetto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo del cantiere *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Stato</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Pianificazione</SelectItem>
                <SelectItem value="in_progress">In corso</SelectItem>
                <SelectItem value="completed">Completato</SelectItem>
                <SelectItem value="on_hold">In pausa</SelectItem>
              </SelectContent>
            </Select>
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
              <Label htmlFor="end_date">Data fine</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salva
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}