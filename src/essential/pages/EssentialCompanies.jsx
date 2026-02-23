import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import { useEssentialData } from '@/essential/useEssentialData';

function CompanyTile({ company }) {
  return (
    <Link to={`/essenziale/societa/${company.id}`} className="block">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-gray-900">{company.name}</p>
            {company.vat_number ? <p className="text-sm text-gray-600 mt-2">P.IVA: {company.vat_number}</p> : null}
          </div>
          <ArrowRight className="h-5 w-5 text-[#ef6144]" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EssentialCompanies() {
  const navigate = useNavigate();
  const { currentContext, currentCompany, companies } = useEssentialData();

  if (currentContext === 'company' && currentCompany) {
    return (
      <div className="space-y-5">
        <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => navigate(`/essenziale/societa/${currentCompany.id}`)}>
          Apri società corrente
        </Button>
        <div className="border-t border-[#ef6144]/20" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => navigate('/essenziale/societa/nuova')}>
        <Plus className="h-4 w-4 mr-2" />
        Crea nuova società
      </Button>

      <div className="border-t border-[#ef6144]/20" />

      {companies.map((company) => (
        <CompanyTile key={company.id} company={company} />
      ))}

      {companies.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            Non fai parte di nessuna società.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
