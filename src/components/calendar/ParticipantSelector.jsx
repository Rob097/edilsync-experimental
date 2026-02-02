import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, User, Building2 } from "lucide-react";

export default function ParticipantSelector({ participants, onChange }) {
  const [participantType, setParticipantType] = useState('user');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const handleAddParticipant = () => {
    if (participantType === 'user') {
      if (selectedUserId) {
        const user = allUsers.find(u => u.id === selectedUserId);
        if (user && !participants.some(p => p.type === 'user' && p.email === user.email)) {
          onChange([...participants, {
            type: 'user',
            user_id: user.id,
            email: user.email,
            name: user.full_name,
          }]);
        }
        setSelectedUserId('');
      } else if (manualEmail && manualEmail.includes('@')) {
        if (!participants.some(p => p.type === 'user' && p.email === manualEmail)) {
          onChange([...participants, {
            type: 'user',
            email: manualEmail,
            name: manualEmail,
          }]);
        }
        setManualEmail('');
      }
    } else {
      if (selectedCompanyId) {
        const company = allCompanies.find(c => c.id === selectedCompanyId);
        if (company && !participants.some(p => p.type === 'company' && p.company_id === company.id)) {
          onChange([...participants, {
            type: 'company',
            company_id: company.id,
            name: company.name,
          }]);
        }
        setSelectedCompanyId('');
      }
    }
  };

  const handleRemoveParticipant = (idx) => {
    onChange(participants.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <Label>Partecipanti</Label>
      
      {/* Add participant form */}
      <div className="flex gap-2">
        <Select value={participantType} onValueChange={setParticipantType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Persona</SelectItem>
            <SelectItem value="company">Società</SelectItem>
          </SelectContent>
        </Select>

        {participantType === 'user' ? (
          <div className="flex-1 flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleziona utente..." />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-gray-400 flex items-center">o</span>
            <Input
              placeholder="Email..."
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="flex-1"
            />
          </div>
        ) : (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} className="flex-1">
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Seleziona società..." />
            </SelectTrigger>
            <SelectContent>
              {allCompanies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button type="button" variant="outline" size="icon" onClick={handleAddParticipant}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Participants list */}
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {participants.map((p, idx) => (
            <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1">
              {p.type === 'user' ? (
                <User className="h-3 w-3" />
              ) : (
                <Building2 className="h-3 w-3" />
              )}
              <span>{p.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveParticipant(idx)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}