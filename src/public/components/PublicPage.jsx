import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PublicPage({
  eyebrow,
  title,
  subtitle,
  bullets = [],
  primaryCta,
  secondaryCta,
}) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      {eyebrow ? <p className="text-sm font-medium text-[#ef6144] mb-3">{eyebrow}</p> : null}
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-4 text-lg text-slate-600 max-w-3xl">{subtitle}</p> : null}

      {bullets.length > 0 ? (
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {bullets.map((item) => (
            <li key={item} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {primaryCta ? (
          <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white">
            <Link to={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
        ) : null}
        {secondaryCta ? (
          <Button asChild variant="outline">
            <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
