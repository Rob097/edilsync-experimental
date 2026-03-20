import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FeatureGateCard({
  title,
  description,
  badgeLabel,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <CardTitle className="text-base text-gray-900">{title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          {badgeLabel ? (
            <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
              <Sparkles className="h-3 w-3 mr-1" />
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      {actionLabel ? (
        <CardContent className="pt-0">
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}