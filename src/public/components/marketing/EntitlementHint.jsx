import React from 'react';
import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function EntitlementHint({ label, className = '' }) {
  if (!label) return null;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:text-[#ef6144] ${className}`.trim()}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] bg-[#141821] text-white">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}