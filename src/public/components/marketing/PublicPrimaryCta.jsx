import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import { APP_AUTH_PATH, PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';

export default function PublicPrimaryCta({ to, label, className = '', dark = false }) {
  const resolvedDestination = to === APP_AUTH_PATH ? PUBLIC_SIGNUP_PATH : to;

  return (
    <Link to={resolvedDestination} className={`${dark ? PUBLIC_CLASSES.darkPrimaryCta : PUBLIC_CLASSES.primaryCta} ${className}`}>
      {label}
      <ArrowRight width={18} height={18} />
    </Link>
  );
}
