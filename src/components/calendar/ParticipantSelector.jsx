import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, User, Building2 } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ParticipantSelector({ participants, onChange }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const [participantType, setParticipantType] = useState('user');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userPublicProfiles'],
    queryFn: () => base44.entities.UserPublicProfile.list(),
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const handleAddParticipant = () => {
    if (participantType === 'user') {
      if (selectedUserId) {
        const user = userProfiles.find(u => u.user_id === selectedUserId);
        if (user && !participants.some(p => p.type === 'user' && p.email === user.user_email)) {
          onChange([...participants, {
            type: 'user',
            user_id: user.user_id,
            email: user.user_email,
            name: user.display_name || user.full_name || user.user_email,
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
      <Label>{tr('Partecipanti', 'Participants')}</Label>
      
      {/* Add participant form */}
      <div className="space-y-2">
        <Select value={participantType} onValueChange={setParticipantType}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{tr('Persona', 'Person')}</SelectItem>
            <SelectItem value="company">{tr('Società', 'Company')}</SelectItem>
          </SelectContent>
        </Select>

        {participantType === 'user' ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={tr('Seleziona utente...', 'Select user...')} />
              </SelectTrigger>
              <SelectContent>
                {userProfiles.map(user => (
                  <SelectItem key={user.id} value={user.user_id}>
                    {user.display_name || user.full_name || user.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-gray-400 flex items-center justify-center sm:justify-start">{tr('o', 'or')}</span>
            <Input
              placeholder={tr('Email...', 'Email...')}
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddParticipant} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-0 mr-2" />
              <span className="sm:hidden">{tr('Aggiungi', 'Add')}</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={tr('Seleziona società...', 'Select company...')} />
              </SelectTrigger>
              <SelectContent>
                {allCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={handleAddParticipant} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-0 mr-2" />
              <span className="sm:hidden">{tr('Aggiungi', 'Add')}</span>
            </Button>
          </div>
        )}
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