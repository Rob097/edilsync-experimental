import React, { useState, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssigneeSelector({ 
  participants = [], 
  companies = [],
  value, 
  onChange,
  label = "Assegnato a *"
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Group and prepare options
  const options = useMemo(() => {
    const userParticipants = participants
      .filter(p => p.participant_type === 'personal' && p.user_email)
      .map(p => ({
        id: p.id,
        type: 'user',
        label: p.user_email,
        email: p.user_email,
      }));

    const companyParticipants = participants
      .filter(p => p.participant_type === 'company' && p.company_id)
      .map(p => {
        const company = companies.find(c => c.id === p.company_id);
        return {
          id: p.id,
          type: 'company',
          label: company?.name || 'Società sconosciuta',
          companyId: p.company_id,
        };
      });

    return { users: userParticipants, companies: companyParticipants };
  }, [participants, companies]);

  // Filter based on search
  const filteredUsers = options.users.filter(u => 
    u.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompanies = options.companies.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = [...options.users, ...options.companies].find(o => o.id === value);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-left"
        >
          {selectedOption ? (
            <>
              {selectedOption.type === 'user' ? (
                <User className="h-4 w-4 text-gray-400" />
              ) : (
                <Building2 className="h-4 w-4 text-gray-400" />
              )}
              <span className="flex-1">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-400">Seleziona assegnatario...</span>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
            
            <ScrollArea className="max-h-64">
              <div className="p-1">
                {filteredUsers.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500">Utenti</div>
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelect(user)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100",
                          value === user.id && "bg-gray-100"
                        )}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="flex-1 text-sm">{user.label}</span>
                        {value === user.id && <Check className="h-4 w-4 text-[#ef6144]" />}
                      </button>
                    ))}
                  </div>
                )}

                {filteredCompanies.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500">Società</div>
                    {filteredCompanies.map(company => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleSelect(company)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100",
                          value === company.id && "bg-gray-100"
                        )}
                      >
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="flex-1 text-sm">{company.label}</span>
                        {value === company.id && <Check className="h-4 w-4 text-[#ef6144]" />}
                      </button>
                    ))}
                  </div>
                )}

                {filteredUsers.length === 0 && filteredCompanies.length === 0 && (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    Nessun risultato
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}