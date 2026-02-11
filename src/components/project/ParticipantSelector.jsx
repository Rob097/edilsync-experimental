import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Building2, Search, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ParticipantSelector({ projectId, value, onChange, label = "Assegnato a" }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => base44.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
  });

  // Group participants by type
  const groupedParticipants = useMemo(() => {
    const personal = participants.filter(p => p.participant_type === 'personal');
    const company = participants.filter(p => p.participant_type === 'company');
    return { personal, company };
  }, [participants]);

  // Filter based on search
  const filteredParticipants = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return {
      personal: groupedParticipants.personal.filter(p => 
        p.user_email?.toLowerCase().includes(query) || 
        p.user_name?.toLowerCase().includes(query)
      ),
      company: groupedParticipants.company.filter(p => 
        p.company_name?.toLowerCase().includes(query)
      ),
    };
  }, [groupedParticipants, searchQuery]);

  // Get selected participant display name
  const selectedParticipant = useMemo(() => {
    if (!value) return null;
    return participants.find(p => p.id === value);
  }, [value, participants]);

  const getDisplayName = (participant) => {
    if (!participant) return 'Seleziona partecipante';
    if (participant.participant_type === 'personal') {
      return participant.user_name || participant.user_email;
    }
    return participant.company_name;
  };

  const handleSelect = (participant) => {
    onChange({
      assigned_participant_id: participant.id,
      assigned_participant_type: participant.participant_type,
      assigned_user_email: participant.participant_type === 'personal' ? participant.user_email : null,
      assigned_user_name: participant.participant_type === 'personal' ? participant.user_name : null,
      assigned_company_id: participant.participant_type === 'company' ? participant.company_id : null,
      assigned_company_name: participant.participant_type === 'company' ? participant.company_name : null,
    });
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              {selectedParticipant?.participant_type === 'company' ? (
                <Building2 className="h-4 w-4 text-gray-500" />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
              {getDisplayName(selectedParticipant)}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Cerca partecipante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {/* Personal participants */}
              {filteredParticipants.personal.length > 0 && (
                <div className="mb-3">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Utenti
                  </div>
                  {filteredParticipants.personal.map((participant) => (
                    <Button
                      key={participant.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleSelect(participant)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-gray-500 shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">
                            {participant.user_name || participant.user_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.project_role}
                          </div>
                        </div>
                        {value === participant.id && (
                          <Check className="h-4 w-4 text-[#ef6144]" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Company participants */}
              {filteredParticipants.company.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Società
                  </div>
                  {filteredParticipants.company.map((participant) => (
                    <Button
                      key={participant.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleSelect(participant)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Building2 className="h-4 w-4 text-gray-500 shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">
                            {participant.company_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.project_role}
                          </div>
                        </div>
                        {value === participant.id && (
                          <Check className="h-4 w-4 text-[#ef6144]" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {filteredParticipants.personal.length === 0 && filteredParticipants.company.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500">
                  Nessun partecipante trovato
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}