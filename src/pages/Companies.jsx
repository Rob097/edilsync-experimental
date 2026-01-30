import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2 } from "lucide-react";
import CompanyCard from '@/components/company/CompanyCard';
import EmptyState from '@/components/ui/EmptyState';

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['allCompanyMembers'],
    queryFn: () => base44.entities.CompanyMember.filter({ status: 'active' }),
  });

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.vat_number && company.vat_number.includes(searchQuery))
  );

  const getMembershipRole = (companyId) => {
    const membership = companyMemberships.find(m => m.company_id === companyId);
    return membership?.role;
  };

  const getMemberCount = (companyId) => {
    return allMembers.filter(m => m.company_id === companyId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le tue Società</h1>
          <p className="text-gray-500 mt-1">Gestisci le società di cui fai parte</p>
        </div>
        <Link to={createPageUrl('NewCompany')}>
          <Button className="bg-[#ef6144] hover:bg-[#d9553a]">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Società
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cerca società..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Company list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCompanies.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              userRole={getMembershipRole(company.id)}
              memberCount={getMemberCount(company.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "Nessun risultato" : "Nessuna società"}
          description={
            searchQuery
              ? "Prova a modificare i termini di ricerca."
              : "Non fai parte di nessuna società. Creane una nuova o attendi un invito."
          }
          actionLabel={!searchQuery ? "Crea Società" : undefined}
          onAction={!searchQuery ? () => window.location.href = createPageUrl('NewCompany') : undefined}
        />
      )}
    </div>
  );
}