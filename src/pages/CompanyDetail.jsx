import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TourLauncher from '@/components/tour/TourLauncher';
import { companyTour } from '@/components/tour/tours/companyTour';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Phone, 
  Mail,
  MapPin,
  UserPlus,
  Settings
} from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import MemberCard from '@/components/company/MemberCard';
import EditCompanyDialog from '@/components/company/EditCompanyDialog';

export default function CompanyDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await base44.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['companyMembers', companyId],
    queryFn: () => base44.entities.CompanyMember.filter({ company_id: companyId }),
    enabled: !!companyId && !!company,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  // Check if current user is admin
  const currentUserMembership = members.find(m => m.user_email === user?.email);
  const isAdmin = currentUserMembership?.role === 'admin';

  const activeMembers = members.filter(m => m.status === 'active');
  const invitedMembers = members.filter(m => m.status === 'invited');

  // Start company tour when viewing company detail as active member
  const shouldStartCompanyTour = user && 
    company && 
    currentUserMembership?.status === 'active' &&
    !user.tour_state?.companies_completed && 
    !user.tour_state?.companies_dismissed;

  if (userLoading || companyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !company) {
    return (
      <EmptyState
        icon={Building2}
        title="Società non trovata"
        description="La società richiesta non esiste o non hai i permessi per visualizzarla."
        actionLabel="Torna alle società"
        onAction={() => navigate(createPageUrl('Companies'))}
      />
    );
  }

  const currentContext = user?.active_context || 'personal';
  const isViewingActiveCompany = currentContext === 'company' && user?.active_company_id === companyId;

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {!isViewingActiveCompany && (
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('Companies'))}
              className="mb-2 -ml-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Società
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#ef6144]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-[#ef6144]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{company.name}</h1>
              {company.vat_number && (
                <p className="text-gray-500 break-words">P.IVA: {company.vat_number}</p>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {company.address && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Indirizzo</p>
                  <p className="font-medium">{company.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {company.phone && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium">{company.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {company.email && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{company.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {company.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card data-tour="company-members">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Membri</CardTitle>
          {isAdmin && (
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invita
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : activeMembers.length > 0 ? (
            <div className="space-y-3">
              {activeMembers.map(member => (
              <MemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.user_email === user?.email}
              isAdmin={isAdmin}
              companyId={companyId}
              canRemoveSelf={false}
              />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nessun membro"
              description="Invita i membri del team a far parte della società."
            />
          )}

          {invitedMembers.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-500 mb-3">In attesa di conferma</h4>
              <div className="space-y-3">
                {invitedMembers.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isPending
                  isAdmin={isAdmin}
                  companyId={companyId}
                />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        companyId={companyId}
      />

      <EditCompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
      />
    </div>
  );
}