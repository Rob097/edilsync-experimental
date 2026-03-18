import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function PublicPrimaryCta({ to, label, className = '', dark = false }) {
  return (
    <Link to={to} className={`${dark ? PUBLIC_CLASSES.darkPrimaryCta : PUBLIC_CLASSES.primaryCta} ${className}`}>
      {label}
      <ArrowRight width={18} height={18} />
    </Link>
  );
}
