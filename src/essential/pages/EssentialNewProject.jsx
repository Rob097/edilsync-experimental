import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useEssentialData } from '@/essential/useEssentialData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function EssentialNewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, currentContext, companyMemberships } = useEssentialData();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    my_role: 'homeowner',
    homeowner_email: '',
  });

  const isCompanyAdmin = useMemo(() => {
    if (currentContext !== 'company') return true;
    const membership = companyMemberships.find((entry) => entry.company_id === user?.active_company_id);
    return membership?.role === 'admin';
  }, [currentContext, companyMemberships, user?.active_company_id]);

  const createProjectMutation = useMutation({
    mutationFn: async (payload) => {
      const myRole = currentContext === 'company' ? payload.my_role : 'homeowner';
      const project = await appClient.entities.Project.create({
        name: payload.name,
        address: payload.address,
        description: payload.description || null,
        status: payload.status,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        owner_type: currentContext,
        owner_company_id: currentContext === 'company' ? user?.active_company_id : null,
        owner_user_id: user?.id,
      });

      const creatorParticipant = await appClient.entities.ProjectParticipant.create({
        project_id: project.id,
        participant_type: currentContext,
        user_id: currentContext === 'personal' ? user?.id : null,
        user_email: user?.email,
        company_id: currentContext === 'company' ? user?.active_company_id : null,
        project_role: myRole,
        status: 'active',
        can_invite: true,
      });

      const channel = await appClient.entities.Channel.create({
        project_id: project.id,
        name: 'General',
        type: 'general',
        description: 'Canale generale per comunicazioni all\'interno del progetto',
        created_by_email: user?.email,
      });

      await appClient.entities.ChannelMember.create({
        channel_id: channel.id,
        project_id: project.id,
        participant_id: creatorParticipant.id,
        user_email: user?.email,
        company_id: currentContext === 'company' ? user?.active_company_id : null,
        last_read_at: new Date().toISOString(),
      });

      const currentProjectIds = user?.project_ids || [];
      await appClient.auth.updateMe({
        project_ids: [...new Set([...currentProjectIds, project.id])],
      });

      if (currentContext === 'company' && payload.my_role === 'contractor' && payload.homeowner_email) {
        await appClient.entities.ProjectParticipant.create({
          project_id: project.id,
          participant_type: 'personal',
          user_id: null,
          user_email: payload.homeowner_email,
          company_id: null,
          project_role: 'homeowner',
          status: 'invited',
          can_invite: true,
        });
      }

      return project;
    },
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['userProjectParticipations'] });
      navigate(`/essenziale/progetti/${project.id}`);
    },
  });

  if (currentContext === 'company' && !isCompanyAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">
          In contesto società solo un admin può creare nuovi progetti.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Nuovo progetto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome progetto</Label>
            <Input id="name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo cantiere</Label>
            <Input id="address" value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea id="description" rows={3} value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
          </div>

          {currentContext === 'company' ? (
            <div className="space-y-2">
              <Label>Ruolo della società nel progetto</Label>
              <Select
                value={formData.my_role}
                onValueChange={(value) => setFormData((prev) => ({
                  ...prev,
                  my_role: value,
                  homeowner_email: value === 'contractor' ? prev.homeowner_email : '',
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homeowner">Committente</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Stato iniziale</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Pianificazione</SelectItem>
                <SelectItem value="in_progress">In corso</SelectItem>
                <SelectItem value="on_hold">In sospeso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data inizio</Label>
              <Input id="start_date" type="date" value={formData.start_date} onChange={(event) => setFormData((prev) => ({ ...prev, start_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data fine</Label>
              <Input id="end_date" type="date" value={formData.end_date} onChange={(event) => setFormData((prev) => ({ ...prev, end_date: event.target.value }))} />
            </div>
          </div>

          {currentContext === 'company' && formData.my_role === 'contractor' ? (
            <div className="space-y-2">
              <Label htmlFor="homeowner_email">Email del committente</Label>
              <Input
                id="homeowner_email"
                type="email"
                value={formData.homeowner_email}
                onChange={(event) => setFormData((prev) => ({ ...prev, homeowner_email: event.target.value }))}
                placeholder="nome@email.com"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/essenziale/progetti')}>
              Annulla
            </Button>
            <Button
              className="bg-[#ef6144] hover:bg-[#d9553a] text-white"
              onClick={() => createProjectMutation.mutate(formData)}
              disabled={createProjectMutation.isPending || !formData.name.trim() || !formData.address.trim() || (currentContext === 'company' && formData.my_role === 'contractor' && !formData.homeowner_email.trim())}
            >
              {createProjectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Crea progetto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
