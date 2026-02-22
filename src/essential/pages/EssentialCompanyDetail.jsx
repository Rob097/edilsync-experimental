import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function EssentialCompanyDetail() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await appClient.entities.Company.filter({ id: companyId });
      return companies[0] || null;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  if (!company) {
    return (
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-6 text-center text-gray-600">Società non trovata.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{company.name}</CardTitle>
        </CardHeader>
      </Card>

      {company.vat_number ? (
        <Card className="border-[#ef6144]/20 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">P.IVA</p><p className="text-lg font-medium">{company.vat_number}</p></CardContent></Card>
      ) : null}
      {company.address ? (
        <Card className="border-[#ef6144]/20 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">Indirizzo</p><p className="text-lg font-medium">{company.address}</p></CardContent></Card>
      ) : null}
      {company.phone ? (
        <Card className="border-[#ef6144]/20 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">Telefono</p><p className="text-lg font-medium">{company.phone}</p></CardContent></Card>
      ) : null}
      {company.email ? (
        <Card className="border-[#ef6144]/20 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">Email</p><p className="text-lg font-medium">{company.email}</p></CardContent></Card>
      ) : null}
      {company.description ? (
        <Card className="border-[#ef6144]/20 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">Descrizione</p><p className="text-lg font-medium">{company.description}</p></CardContent></Card>
      ) : null}

      <Button variant="outline" className="w-full border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" onClick={() => navigate(`/CompanyDetail?id=${company.id}`)}>
        Apri dettagli completi
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
