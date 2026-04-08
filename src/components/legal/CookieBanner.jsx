import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';
import { localizePublicPath } from '@/public/lib/localePath';

const COOKIE_CONSENT_KEY = 'edilsync_cookie_consent';

export default function CookieBanner() {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const [visible, setVisible] = useState(false);
  const cookiePolicyPath = localizePublicPath('/cookie', location.pathname);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-lg p-4 sm:p-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-5 w-5 text-[#ef6144] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {tr('Utilizziamo cookie tecnici necessari per il funzionamento del servizio e cookie analitici per migliorare la tua esperienza. Per maggiori informazioni consulta la nostra', 'We use technical cookies necessary for the service and analytics cookies to improve your experience. For more information, see our')}{' '}
            <Link to={cookiePolicyPath} className="text-[#ef6144] hover:underline font-medium">
              {tr('Cookie Policy', 'Cookie Policy')}
            </Link>.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="h-11 flex-1 sm:flex-none px-4"
          >
            {tr('Solo necessari', 'Only necessary')}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="h-11 flex-1 sm:flex-none px-4 bg-[#ef6144] hover:bg-[#d9553a]"
          >
            {tr('Accetta tutti', 'Accept all')}
          </Button>
        </div>
      </div>
    </div>
  );
}