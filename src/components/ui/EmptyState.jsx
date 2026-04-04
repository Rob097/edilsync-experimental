import React from 'react';
import { Button } from "@/components/ui/button";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="app-panel-muted flex flex-col items-center justify-center rounded-[1.75rem] px-5 py-16 text-center">
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[rgba(239,97,68,0.12)]">
          <Icon className="h-8 w-8 text-[#d9553a]" />
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold tracking-[-0.02em] text-[#231b18]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-[#6d5c55]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}