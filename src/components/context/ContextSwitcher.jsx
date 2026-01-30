import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, User, ChevronDown, Check } from "lucide-react";

export default function ContextSwitcher({ 
  currentContext, 
  currentCompany, 
  companies, 
  onContextChange 
}) {
  const isPersonal = currentContext === 'personal';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50"
        >
          {isPersonal ? (
            <>
              <User className="h-4 w-4 text-[#ef6144]" />
              <span className="font-medium">Privato</span>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 text-[#ef6144]" />
              <span className="font-medium truncate max-w-[150px]">
                {currentCompany?.name || 'Società'}
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={() => onContextChange('personal', null)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Privato</span>
          </div>
          {isPersonal && <Check className="h-4 w-4 text-[#ef6144]" />}
        </DropdownMenuItem>
        
        {companies.length > 0 && <DropdownMenuSeparator />}
        
        {companies.map((company) => (
          <DropdownMenuItem 
            key={company.id}
            onClick={() => onContextChange('company', company)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{company.name}</span>
            </div>
            {!isPersonal && currentCompany?.id === company.id && (
              <Check className="h-4 w-4 text-[#ef6144]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}