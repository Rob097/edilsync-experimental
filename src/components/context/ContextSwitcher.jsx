import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, User, ChevronDown, Check } from "lucide-react";

export default function ContextSwitcher({ 
  currentContext, 
  currentCompany, 
  companies, 
  onContextChange 
}) {
  const isPersonal = currentContext === 'personal';
  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleContextSelect = (context, company) => {
    // Don't show confirmation if selecting current context
    if (context === currentContext && company?.id === currentCompany?.id) {
      return;
    }

    setConfirmDialog({ context, company });
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      onContextChange(confirmDialog.context, confirmDialog.company);
      setConfirmDialog(null);
    }
  };

  const getCurrentContextLabel = () => {
    return isPersonal ? 'Privato' : currentCompany?.name || 'Società';
  };

  const getNewContextLabel = () => {
    if (!confirmDialog) return '';
    return confirmDialog.context === 'personal' ? 'Privato' : confirmDialog.company?.name || 'Società';
  };

  return (
    <>
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
            onClick={() => handleContextSelect('personal', null)}
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
              onClick={() => handleContextSelect('company', company)}
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

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiare contesto di lavoro?</DialogTitle>
            <DialogDescription>
              Stai per passare dal contesto "<strong>{getCurrentContextLabel()}</strong>" a "<strong>{getNewContextLabel()}</strong>". 
              Sarai reindirizzato alla home page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Annulla
            </Button>
            <Button onClick={handleConfirm} className="bg-[#ef6144] hover:bg-[#d9553a]">
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}