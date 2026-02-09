import React, { useState } from 'react';
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const professions = [
  { value: 'general', label: 'Generale' },
  { value: 'architect', label: 'Architetto' },
  { value: 'engineer', label: 'Ingegnere' },
  { value: 'surveyor', label: 'Geometra' },
  { value: 'designer', label: 'Designer' },
  { value: 'accountant', label: 'Contabile' },
  { value: 'other', label: 'Altro' },
];

export default function InviteMemberDialog({ open, onOpenChange, companyId }) {
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [profession, setProfession] = useState('general');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const member = await base44.entities.CompanyMember.create({
        company_id: companyId,
        user_email: email,
        role: role,
        profession: profession,
        status: 'invited',
      });

      // Trigger backend function to send email and notification
      await base44.functions.call('handleCompanyInvite', {
        member_id: member.id,
      });

      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyMembers', companyId]);
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setEmail('');
    setRole('member');
    setProfession('general');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  const isValid = email && email.includes('@');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invita Membro</DialogTitle>
          <DialogDescription>
            Invita una nuova persona a far parte della società.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@esempio.it"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Ruolo nella società</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Amministratore</SelectItem>
                <SelectItem value="member">Membro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Professione</Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {professions.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
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