import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TourLauncher from '@/components/tour/TourLauncher';
import { companyTour } from '@/components/tour/tours/companyTour';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Plus, Search, Building2 } from "lucide-react";
import CompanyCard from '@/components/company/CompanyCard';
import EmptyState from '@/components/ui/EmptyState';

export default function Companies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60 * 1000,
  });

  const currentContext = user?.active_context || 'personal';

  // If in company context, redirect to company detail
  React.useEffect(() => {
    if (currentContext === 'company' && user?.active_company_id) {
      navigate(createPageUrl('CompanyDetail') + `?id=${user.active_company_id}`);
    }
  }, [currentContext, user?.active_company_id, navigate]);

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanies', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies', companyMemberships],
    queryFn: async () => {
      if (companyMemberships.length === 0) return [];
      const companyIds = companyMemberships.map(m => m.company_id);
      const allCompanies = await base44.entities.Company.list();
      return allCompanies.filter(c => companyIds.includes(c.id));
    },
    enabled: companyMemberships.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['allCompanyMembers'],
    queryFn: () => base44.entities.CompanyMember.filter({ status: 'active' }),
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = userLoading || companiesLoading;

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

  // Start company tour if user has companies and tour not completed/dismissed  
  const shouldStartCompanyTour = user && 
    companies.length > 0 && 
    !user.tour_state?.companies_completed && 
    !user.tour_state?.companies_dismissed;

  return (
    <div className="space-y-6">
      {/* Launch company tour */}
      <TourLauncher 
        tourId="companies" 
        steps={companyTour.steps} 
        trigger={shouldStartCompanyTour}
        delay={1000}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le tue Società</h1>
          <p className="text-gray-500 mt-1">Gestisci le società di cui fai parte</p>
        </div>
        {currentContext === 'personal' && (
          <Link to={createPageUrl('NewCompany')}>
            <Button className="bg-[#ef6144] hover:bg-[#d9553a]">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Società
            </Button>
          </Link>
        )}
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
          onAction={!searchQuery ? () => navigate(createPageUrl('NewCompany')) : undefined}
        />
      )}
    </div>
  );
}