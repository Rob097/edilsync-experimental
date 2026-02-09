import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FullPageLoader({ message = 'Caricamento...' }) {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-[#ef6144] animate-spin" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}