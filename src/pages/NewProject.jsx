import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import ContextBadge from '@/components/context/ContextBadge';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
  });

  const currentContext = user?.active_context || 'personal';
  const currentCompany = companies.find(c => c.id === user?.active_company_id);

  // Check if user is admin when in company context
  const userCompanyMembership = companyMemberships.find(m => m.company_id === user?.active_company_id);
  const isCompanyAdmin = userCompanyMembership?.role === 'admin';

  // Prevent access if in company context but not admin
  React.useEffect(() => {
    if (currentContext === 'company' && !isCompanyAdmin && companyMemberships.length > 0) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [currentContext, isCompanyAdmin, companyMemberships.length, navigate]);

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const { my_role, homeowner_email, ...projectData } = data;
      
      // Create project
      const project = await base44.entities.Project.create({
        ...projectData,
        owner_type: currentContext,
        owner_company_id: currentContext === 'company' ? user?.active_company_id : null,
        owner_user_id: user?.id,
      });

      // Create participant for project creator (homeowner or contractor)
      const creatorParticipant = await base44.entities.ProjectParticipant.create({
        project_id: project.id,
        participant_type: currentContext,
        user_id: currentContext === 'personal' ? user?.id : null,
        user_email: user?.email,
        company_id: currentContext === 'company' ? user?.active_company_id : null,
        project_role: my_role,
        status: 'active',
        can_invite: true,
      });

      // Create General channel for project
      const channel = await base44.entities.Channel.create({
        project_id: project.id,
        name: 'General',
        type: 'general',
        description: 'Canale generale per comunicazioni all\'interno del progetto',
        created_by_email: user?.email,
      });

      // Add creator as channel member
      await base44.entities.ChannelMember.create({
        channel_id: channel.id,
        project_id: project.id,
        participant_id: creatorParticipant.id,
        user_email: user?.email,
        company_id: currentContext === 'company' ? user?.active_company_id : null,
        last_read_at: new Date().toISOString(),
      });

      // Immediately update user access arrays (so RLS works without waiting for automation)
      const currentProjectIds = user?.project_ids || [];
      await base44.auth.updateMe({
        project_ids: [...new Set([...currentProjectIds, project.id])],
      });

      // If contractor, invite homeowner
      if (my_role === 'contractor' && homeowner_email) {
        await base44.entities.ProjectParticipant.create({
          project_id: project.id,
          participant_type: 'personal',
          user_id: null,
          user_email: homeowner_email,
          company_id: null,
          project_role: 'homeowner',
          status: 'invited',
          can_invite: true,
        });
      }

      return project;
    },
    onSuccess: async (project) => {
      await queryClient.invalidateQueries(['projects']);
      await queryClient.invalidateQueries(['userProjectParticipations']);
      await queryClient.refetchQueries(['userProjectParticipations']);
      navigate(createPageUrl('ProjectDetail') + `?id=${project.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nuovo Progetto</CardTitle>
          <CardDescription className="flex items-center gap-2">
            Stai creando un progetto come
            <ContextBadge context={currentContext} companyName={currentCompany?.name} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome del progetto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Es. Ristrutturazione Via Roma 15"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo del cantiere *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Es. Via Roma 15, 20121 Milano"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrivi brevemente il progetto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Il tuo ruolo nel progetto</Label>
              <Select 
                value={formData.my_role} 
                onValueChange={(v) => handleChange('my_role', v)}
                disabled={currentContext === 'personal'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homeowner">Committente</SelectItem>
                  {currentContext === 'company' && (
                    <SelectItem value="contractor">Contractor</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {currentContext === 'personal' && (
                <p className="text-xs text-gray-500">
                  Come privato puoi creare progetti solo come committente
                </p>
              )}
            </div>

            {currentContext === 'company' && formData.my_role === 'contractor' && (
              <div className="space-y-2">
                <Label htmlFor="homeowner_email">Email del committente *</Label>
                <Input
                  id="homeowner_email"
                  type="email"
                  value={formData.homeowner_email}
                  onChange={(e) => handleChange('homeowner_email', e.target.value)}
                  placeholder="email@committente.it"
                  required
                />
                <p className="text-xs text-gray-500">
                  Il committente riceverà un invito al progetto
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Pianificazione</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="on_hold">In pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data inizio prevista</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data fine prevista</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crea Progetto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}