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
import { useLanguage } from '@/components/i18n/useLanguage';

export default function ContextSwitcher({ 
  currentContext, 
  currentCompany, 
  companies, 
  onContextChange 
}) {
  const { t, currentLanguage } = useLanguage();
  const isPersonal = currentContext === 'personal';
  const [confirmDialog, setConfirmDialog] = useState(null);
  const tx = (key, options) => t(`completeScoped.components_context_ContextSwitcher.${key}`, options);
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
    return isPersonal ? tx('k1') : currentCompany?.name || tx('k2');
  };

  const getNewContextLabel = () => {
    if (!confirmDialog) return '';
    return confirmDialog.context === 'personal'
      ? tx('k3')
      : confirmDialog.company?.name || tx('k4');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-10 gap-2 border-[rgba(197,177,165,0.52)] bg-[rgba(255,250,247,0.88)] px-4 text-[#231b18]"
          >
            {isPersonal ? (
              <>
                <User className="h-4 w-4 text-[#ef6144]" />
                <span className="font-medium">{tx('k5')}</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 text-[#ef6144]" />
                <span className="font-medium truncate max-w-[150px]">
                  {currentCompany?.name || tx('k6')}
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
              <span>{tx('k7')}</span>
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
            <DialogTitle>{tx('k8')}</DialogTitle>
            <DialogDescription>
              {tx('k9')}{' '}
              "<strong>{getCurrentContextLabel()}</strong>"{' '}
              {tx('k10')}{' '}
              "<strong>{getNewContextLabel()}</strong>". {tx('k11')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}