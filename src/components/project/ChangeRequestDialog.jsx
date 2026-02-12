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
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ChangeRequestDialog({ open, onOpenChange, request, projectId, canRespond }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost_impact: '',
    time_impact_days: '',
    response_note: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || '',
        description: request.description || '',
        cost_impact: request.cost_impact || '',
        time_impact_days: request.time_impact_days || '',
        response_note: request.response_note || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        cost_impact: '',
        time_impact_days: '',
        response_note: '',
      });
    }
  }, [request, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (request) {
        return base44.entities.ChangeRequest.update(request.id, data);
      } else {
        return base44.entities.ChangeRequest.create({
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
      return base44.entities.ChangeRequest.update(request.id, {
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
    const data = {
      title: formData.title,
      description: formData.description,
      cost_impact: formData.cost_impact ? parseFloat(formData.cost_impact) : 0,
      time_impact_days: formData.time_impact_days ? parseInt(formData.time_impact_days) : 0,
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
            {request ? 'Richiesta di Modifica' : 'Nuova Richiesta di Modifica'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Es. Cambiare tipo di piastrelle"
              required
              disabled={!!request}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrivi la modifica richiesta..."
              rows={3}
              required
              disabled={!!request}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_impact">Costo aggiuntivo (€)</Label>
              <Input
                id="cost_impact"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_impact}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_impact: e.target.value }))}
                placeholder="0.00"
                disabled={!!request}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_impact_days">Giorni aggiuntivi</Label>
              <Input
                id="time_impact_days"
                type="number"
                min="0"
                value={formData.time_impact_days}
                onChange={(e) => setFormData(prev => ({ ...prev, time_impact_days: e.target.value }))}
                placeholder="0"
                disabled={!!request}
              />
            </div>
          </div>

          {request && canRespond && isPending && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="response_note">Risposta</Label>
              <Textarea
                id="response_note"
                value={formData.response_note}
                onChange={(e) => setFormData(prev => ({ ...prev, response_note: e.target.value }))}
                placeholder="Aggiungi una nota opzionale..."
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
                  Rifiuta
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
                  Approva
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  {request ? 'Chiudi' : 'Annulla'}
                </Button>
                {!request && (
                  <Button
                    type="submit"
                    className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                    disabled={!isValid || saveMutation.isPending}
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Invia Richiesta
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