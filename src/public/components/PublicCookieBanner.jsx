import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { localizePublicPath } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';

const COOKIE_CONSENT_KEY = 'edilsync_cookie_consent';

export default function PublicCookieBanner() {
  const location = useLocation();
  const locale = location.pathname.startsWith('/en') ? 'en' : 'it';
  const copy = getPublicCopy(locale, 'cookieBanner');
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

  if (!visible) {
    return null;
  }

  return (
    <div className="public-cookie-banner fixed bottom-0 left-0 right-0 z-[140] border-t border-gray-200 bg-white/95 p-4 shadow-[0_-18px_40px_rgba(34,24,20,0.12)] backdrop-blur">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="order-2 flex items-start gap-3 sm:order-1 sm:flex-1">
          <Cookie className="h-5 w-5 text-[#ef6144] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {copy.text}{' '}
            <Link to={cookiePolicyPath} className="text-[#ef6144] hover:underline font-medium">
              {copy.linkLabel}
            </Link>.
          </p>
        </div>
        <div className="order-1 flex w-full gap-2 sm:order-2 sm:w-auto sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="h-11 flex-1 sm:flex-none px-4"
          >
            {copy.rejectAction}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="h-11 flex-1 sm:flex-none px-4 bg-[#ef6144] hover:bg-[#d9553a]"
          >
            {copy.acceptAction}
          </Button>
        </div>
      </div>
    </div>
  );
}