import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, User } from "lucide-react";

const projectRoles = [
  { value: 'contractor', label: 'Contractor', description: 'Impresa che esegue i lavori principali' },
  { value: 'subcontractor', label: 'Subappaltatore', description: 'Lavora per conto di un contractor' },
  { value: 'architect', label: 'Architetto', description: 'Progettista architettonico' },
  { value: 'engineer', label: 'Ingegnere', description: 'Progettista strutturale o impiantistico' },
  { value: 'surveyor', label: 'Geometra', description: 'Supporto tecnico e pratiche' },
  { value: 'designer', label: 'Designer', description: 'Progettista di interni' },
  { value: 'consultant', label: 'Consulente', description: 'Consulenza specializzata' },
];

export default function InviteParticipantDialog({ 
  open, 
  onOpenChange, 
  projectId,
  currentUserParticipation 
}) {
  const queryClient = useQueryClient();
  
  const [participantType, setParticipantType] = useState('company');
  const [email, setEmail] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [projectRole, setProjectRole] = useState('');

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const participantData = {
        project_id: projectId,
        participant_type: participantType,
        project_role: projectRole,
        status: 'invited',
        can_invite: projectRole === 'contractor', // Contractors can invite subcontractors
      };

      if (participantType === 'company') {
        participantData.company_id = selectedCompanyId;
      } else {
        participantData.user_email = email;
      }

      // If current user is a contractor, mark this as a subcontractor invite
      if (currentUserParticipation?.project_role === 'contractor') {
        participantData.invited_by_company_id = currentUserParticipation.company_id;
      }

      return base44.entities.ProjectParticipant.create(participantData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projectParticipants', projectId]);
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setParticipantType('company');
    setEmail('');
    setSelectedCompanyId('');
    setProjectRole('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  const isValid = projectRole && (
    (participantType === 'company' && selectedCompanyId) ||
    (participantType === 'personal' && email)
  );

  // Filter available roles based on who is inviting
  const availableRoles = currentUserParticipation?.project_role === 'contractor'
    ? projectRoles.filter(r => r.value === 'subcontractor')
    : projectRoles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invita Partecipante</DialogTitle>
          <DialogDescription>
            Invita una società o un professionista a partecipare al progetto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Participant Type */}
          <div className="space-y-3">
            <Label>Tipo di partecipante</Label>
            <RadioGroup 
              value={participantType} 
              onValueChange={setParticipantType}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="company" id="company" className="peer sr-only" />
                <Label
                  htmlFor="company"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-[#ef6144] peer-data-[state=checked]:bg-[#ef6144]/5"
                >
                  <Building2 className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="font-medium">Società</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="personal" id="personal" className="peer sr-only" />
                <Label
                  htmlFor="personal"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-[#ef6144] peer-data-[state=checked]:bg-[#ef6144]/5"
                >
                  <User className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="font-medium">Persona</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Company or Email */}
          {participantType === 'company' ? (
            <div className="space-y-2">
              <Label>Seleziona società</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli una società..." />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.it"
              />
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label>Ruolo nel progetto</Label>
            <Select value={projectRole} onValueChange={setProjectRole}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona ruolo..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={!isValid || inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Invita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}