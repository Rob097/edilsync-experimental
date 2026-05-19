import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock3, MapPin, Plus, Download } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function toLocalInputValue(dateIso) {
  if (!dateIso) return '';
  const date = new Date(dateIso);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

async function captureGpsIfSupported(enableGps) {
  if (!enableGps || typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 60 * 1000,
        timeout: 5000,
      },
    );
  });
}

function formatGpsValue(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num.toFixed(6);
}

export default function CompanyTimeTrackingSection({
  companyId,
  companyName: _companyName,
  currentUser,
  isAdmin,
  mode = 'normal',
}) {
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_company_CompanyTimeTrackingSection.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const [startProjectId, setStartProjectId] = useState('__none__');
  const [startNote, setStartNote] = useState('');
  const [stopNote, setStopNote] = useState('');

  const [manualOpen, setManualOpen] = useState(false);
  const [manualMemberEmail, setManualMemberEmail] = useState('');
  const [manualProjectId, setManualProjectId] = useState('__none__');
  const [manualStartAt, setManualStartAt] = useState('');
  const [manualEndAt, setManualEndAt] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualNote, setManualNote] = useState('');

  const [closeDialogTarget, setCloseDialogTarget] = useState(null);
  const [closeDialogEndedAt, setCloseDialogEndedAt] = useState('');
  const [closeDialogReason, setCloseDialogReason] = useState('');
  const [closeDialogNote, setCloseDialogNote] = useState('');
  const [adminFilterFromDate, setAdminFilterFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adminFilterToDate, setAdminFilterToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adminFilterMember, setAdminFilterMember] = useState('__all__');
  const [adminFilterProject, setAdminFilterProject] = useState('__all__');

  const { data: companyMembers = [] } = useQuery({
    queryKey: ['companyMembers', companyId],
    queryFn: () => appClient.entities.CompanyMember.filter({ company_id: companyId, status: 'active' }),
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!currentUser?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['workSessions', companyId],
    queryFn: () => appClient.entities.WorkSession.filter({ company_id: companyId }, '-started_at'),
    enabled: !!companyId,
    staleTime: 30 * 1000,
  });

  const { data: projectParticipations = [] } = useQuery({
    queryKey: ['companyProjectParticipations', companyId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ company_id: companyId, participant_type: 'company' }),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['allProjectsForWorkSessions'],
    queryFn: () => appClient.entities.Project.list('-created_date'),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const activeProjectIds = useMemo(() => {
    return new Set(
      projectParticipations
        .filter((entry) => entry.status === 'active' || entry.status === 'invited')
        .map((entry) => entry.project_id),
    );
  }, [projectParticipations]);

  const projectOptions = useMemo(
    () => allProjects.filter((project) => activeProjectIds.has(project.id)),
    [allProjects, activeProjectIds],
  );

  const myOpenSession = sessions.find((session) =>
    session.user_email === currentUser?.email && !session.ended_at,
  ) || null;

  const openSessions = sessions.filter((session) => !session.ended_at);
  const companyRecentSessions = sessions.slice(0, 10);

  const projectById = useMemo(() => {
    const map = new Map();
    for (const project of allProjects) {
      map.set(project.id, project);
    }
    return map;
  }, [allProjects]);

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: ['workSessions', companyId] });
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      const gps = await captureGpsIfSupported(true);
      return appClient.entities.WorkSession.create({
        company_id: companyId,
        user_email: currentUser?.email,
        project_id: startProjectId !== '__none__' ? startProjectId : null,
        started_at: new Date().toISOString(),
        note: startNote || null,
        entry_type: 'live',
        source_mode: mode,
        clock_in_latitude: gps?.latitude ?? null,
        clock_in_longitude: gps?.longitude ?? null,
        clock_in_accuracy_m: gps?.accuracy ?? null,
      });
    },
    onSuccess: () => {
      setStartNote('');
      setStopNote('');
      setStartProjectId('__none__');
      invalidateSessions();
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!myOpenSession) return null;
      const gps = await captureGpsIfSupported(true);
      const mergedNote = [myOpenSession.note, stopNote].filter(Boolean).join('\n').trim();

      return appClient.entities.WorkSession.update(myOpenSession.id, {
        ended_at: new Date().toISOString(),
        note: mergedNote || null,
        clock_out_latitude: gps?.latitude ?? null,
        clock_out_longitude: gps?.longitude ?? null,
        clock_out_accuracy_m: gps?.accuracy ?? null,
      });
    },
    onSuccess: () => {
      setStopNote('');
      invalidateSessions();
    },
  });

  const manualCreateMutation = useMutation({
    mutationFn: () => appClient.entities.WorkSession.create({
      company_id: companyId,
      user_email: manualMemberEmail,
      project_id: manualProjectId !== '__none__' ? manualProjectId : null,
      started_at: new Date(manualStartAt).toISOString(),
      ended_at: manualEndAt ? new Date(manualEndAt).toISOString() : null,
      note: manualNote || null,
      manual_reason: manualReason || null,
      entry_type: 'manual_admin',
      source_mode: mode,
    }),
    onSuccess: () => {
      setManualOpen(false);
      setManualMemberEmail('');
      setManualProjectId('__none__');
      setManualStartAt('');
      setManualEndAt('');
      setManualReason('');
      setManualNote('');
      invalidateSessions();
    },
  });

  const manualCloseMutation = useMutation({
    mutationFn: () => {
      if (!closeDialogTarget) return null;
      const mergedNote = [closeDialogTarget.note, closeDialogNote].filter(Boolean).join('\n').trim();
      return appClient.entities.WorkSession.update(closeDialogTarget.id, {
        ended_at: new Date(closeDialogEndedAt).toISOString(),
        manual_reason: closeDialogReason || null,
        note: mergedNote || null,
      });
    },
    onSuccess: () => {
      setCloseDialogTarget(null);
      setCloseDialogEndedAt('');
      setCloseDialogReason('');
      setCloseDialogNote('');
      invalidateSessions();
    },
  });

  const myRecentSessions = sessions
    .filter((session) => session.user_email === currentUser?.email)
    .slice(0, 8);

  const filteredAdminSessions = useMemo(() => {
    if (!isAdmin) return [];

    const matchesDateRange = (session) => {
      const sessionDay = format(new Date(session.started_at), 'yyyy-MM-dd');
      if (adminFilterFromDate && sessionDay < adminFilterFromDate) return false;
      if (adminFilterToDate && sessionDay > adminFilterToDate) return false;
      return true;
    };

    const matchesMember = (session) => {
      if (adminFilterMember === '__all__') return true;
      return session.user_email === adminFilterMember;
    };

    const matchesProject = (session) => {
      if (adminFilterProject === '__all__') return true;
      if (adminFilterProject === '__none__') return !session.project_id;
      return session.project_id === adminFilterProject;
    };

    return sessions
      .filter((session) => matchesDateRange(session) && matchesMember(session) && matchesProject(session))
      .sort((first, second) => new Date(second.started_at) - new Date(first.started_at));
  }, [sessions, isAdmin, adminFilterFromDate, adminFilterToDate, adminFilterMember, adminFilterProject]);

  const triggerDownload = (filename, content, mimeType) => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const formatDurationHours = (session) => {
    if (!session.ended_at) return '';
    const start = new Date(session.started_at);
    const end = new Date(session.ended_at);
    const hours = (end - start) / (1000 * 60 * 60);
    return Number.isFinite(hours) ? hours.toFixed(2) : '';
  };

  const getExportRows = () => {
    return filteredAdminSessions.map((session) => ({
      day: format(new Date(session.started_at), 'yyyy-MM-dd'),
      started_at: session.started_at,
      ended_at: session.ended_at || '',
      member: getUserDisplayNameByEmail(session.user_email, allUsers),
      member_email: session.user_email,
      project: session.project_id ? (projectById.get(session.project_id)?.name || tx('k1')) : tx('k2'),
      duration_hours: formatDurationHours(session),
      entry_type: session.entry_type || '',
      manual_reason: session.manual_reason || '',
      note: session.note || '',
      clock_in_latitude: session.clock_in_latitude ?? '',
      clock_in_longitude: session.clock_in_longitude ?? '',
      clock_out_latitude: session.clock_out_latitude ?? '',
      clock_out_longitude: session.clock_out_longitude ?? '',
    }));
  };

  const toDelimited = (rows, delimiter = ',') => {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => {
      const raw = value === null || value === undefined ? '' : String(value);
      if (raw.includes('"') || raw.includes('\n') || raw.includes(delimiter)) {
        return `"${raw.replace(/"/g, '""')}"`;
      }
      return raw;
    };

    const lines = [headers.join(delimiter)];
    rows.forEach((row) => {
      lines.push(headers.map((header) => escapeCell(row[header])).join(delimiter));
    });
    return lines.join('\n');
  };

  const toXml = (rows) => {
    if (rows.length === 0) return '';
    const esc = (value) => {
      const raw = value === null || value === undefined ? '' : String(value);
      return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const recordToXml = (row) => {
      return Object.entries(row)
        .map(([key, value]) => `<${key}>${esc(value)}</${key}>`)
        .join('');
    };

    const body = rows.map((row) => `<session>${recordToXml(row)}</session>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><work_sessions>${body}</work_sessions>`;
  };

  const exportSessions = (formatType) => {
    const rows = getExportRows();
    const fromText = adminFilterFromDate || 'all';
    const toText = adminFilterToDate || 'all';
    const fileSuffix = `${fromText}_to_${toText}`;

    if (rows.length === 0) return;

    if (formatType === 'csv') {
      triggerDownload(`timbrature_${fileSuffix}.csv`, toDelimited(rows, ','), 'text/csv;charset=utf-8;');
      return;
    }

    if (formatType === 'xml') {
      triggerDownload(`timbrature_${fileSuffix}.xml`, toXml(rows), 'application/xml;charset=utf-8;');
      return;
    }

    if (formatType === 'json') {
      triggerDownload(`timbrature_${fileSuffix}.json`, JSON.stringify(rows, null, 2), 'application/json;charset=utf-8;');
      return;
    }

    if (formatType === 'txt') {
      const lines = rows.map((row) => [
        row.day,
        row.member,
        row.member_email,
        row.project,
        row.started_at,
        row.ended_at,
        row.duration_hours,
        row.note,
      ].join(' | '));
      triggerDownload(`timbrature_${fileSuffix}.txt`, lines.join('\n'), 'text/plain;charset=utf-8;');
    }
  };

  const canStart = !!currentUser?.email && !myOpenSession && !startMutation.isPending;
  const canStop = !!myOpenSession && !stopMutation.isPending;

  if (mode === 'operational') {
    const buttonDisabled = myOpenSession ? !canStop : !canStart;
    const buttonLabel = myOpenSession
      ? (stopMutation.isPending ? tx('k3') : 'Clock-out')
      : (startMutation.isPending ? tx('k4') : 'Clock-in');

    return (
      <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="h-5 w-5 text-[#ef6144]" />
            {tx('k5')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {myOpenSession ? (
              <Badge className="bg-green-100 text-green-700">
                {tx('k6')} · {format(new Date(myOpenSession.started_at), 'HH:mm', { locale: dateLocale })}
              </Badge>
            ) : (
              <Badge variant="outline">{tx('k7')}</Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tx('k8')}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>{tx('k9')}</Label>
            <Select value={startProjectId} onValueChange={setStartProjectId} disabled={!!myOpenSession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{tx('k10')}</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {myOpenSession?.project_id && (
              <p className="text-xs text-gray-500">
                {tx('k11')}: {projectById.get(myOpenSession.project_id)?.name || tx('k12')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{tx('k13')}</Label>
            <Textarea
              value={myOpenSession ? stopNote : startNote}
              onChange={(event) => {
                if (myOpenSession) {
                  setStopNote(event.target.value);
                  return;
                }
                setStartNote(event.target.value);
              }}
              placeholder={tx('k14')}
              rows={3}
            />
          </div>

          <Button
            className="w-full h-14 text-base font-semibold bg-[#ef6144] hover:bg-[#d9553a]"
            disabled={buttonDisabled}
            onClick={() => {
              if (myOpenSession) {
                stopMutation.mutate();
                return;
              }
              startMutation.mutate();
            }}
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderGpsInfo = (label, lat, lng, accuracy) => {
    const latVal = formatGpsValue(lat);
    const lngVal = formatGpsValue(lng);
    if (!latVal || !lngVal) {
      return <p className="text-xs text-gray-500">{label}: {tx('k15')}</p>;
    }

    const accuracyText = Number.isFinite(Number(accuracy))
      ? ` (${tx('k16')} ${Math.round(Number(accuracy))}m)`
      : '';

    return (
      <p className="text-xs text-gray-600">
        {label}: {latVal}, {lngVal}{accuracyText} ·{' '}
        <a
          className="text-[#ef6144] hover:underline"
          href={`https://www.google.com/maps?q=${latVal},${lngVal}`}
          target="_blank"
          rel="noreferrer"
        >
          {tx('k17')}
        </a>
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="h-5 w-5 text-[#ef6144]" />
            {tx('k18')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {myOpenSession ? (
              <Badge className="bg-green-100 text-green-700">
                {tx('k19')} · {format(new Date(myOpenSession.started_at), 'HH:mm', { locale: dateLocale })}
              </Badge>
            ) : (
              <Badge variant="outline">{tx('k20')}</Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tx('k21')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tx('k22')}</Label>
              <Select value={startProjectId} onValueChange={setStartProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{tx('k23')}</SelectItem>
                  {projectOptions.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{tx('k24')}</Label>
              <Textarea
                value={myOpenSession ? stopNote : startNote}
                onChange={(event) => {
                  if (myOpenSession) {
                    setStopNote(event.target.value);
                    return;
                  }
                  setStartNote(event.target.value);
                }}
                placeholder={tx('k25')}
                rows={2}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!canStart}
              onClick={() => startMutation.mutate()}
            >
              {startMutation.isPending ? tx('k26') : tx('k27')}
            </Button>
            <Button variant="outline" disabled={!canStop} onClick={() => stopMutation.mutate()}>
              {stopMutation.isPending ? tx('k28') : tx('k29')}
            </Button>

            {isAdmin && (
              <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {tx('k30')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{tx('k31')}</DialogTitle>
                    <DialogDescription>
                      {tx('k32')}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{tx('k33')}</Label>
                      <Select value={manualMemberEmail} onValueChange={setManualMemberEmail}>
                        <SelectTrigger><SelectValue placeholder={tx('k34')} /></SelectTrigger>
                        <SelectContent>
                          {companyMembers.map((member) => (
                            <SelectItem key={member.id} value={member.user_email}>
                              {getUserDisplayNameByEmail(member.user_email, allUsers)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{tx('k35')}</Label>
                      <Select value={manualProjectId} onValueChange={setManualProjectId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{tx('k36')}</SelectItem>
                          {projectOptions.map((project) => (
                            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{tx('k37')}</Label>
                        <Input type="datetime-local" value={manualStartAt} onChange={(event) => setManualStartAt(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{tx('k38')}</Label>
                        <Input type="datetime-local" value={manualEndAt} onChange={(event) => setManualEndAt(event.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{tx('k39')}</Label>
                      <Input value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder={tx('k40')} />
                    </div>

                    <div className="space-y-2">
                      <Label>{tx('k41')}</Label>
                      <Textarea value={manualNote} onChange={(event) => setManualNote(event.target.value)} rows={2} />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setManualOpen(false)}>{tx('k42')}</Button>
                      <Button
                        className="bg-[#ef6144] hover:bg-[#d9553a]"
                        disabled={!manualMemberEmail || !manualStartAt || manualCreateMutation.isPending}
                        onClick={() => manualCreateMutation.mutate()}
                      >
                        {manualCreateMutation.isPending ? tx('k43') : tx('k44')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tx('k45')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRecentSessions.length === 0 ? (
            <p className="text-sm text-gray-600">{tx('k46')}</p>
          ) : (
            myRecentSessions.map((session) => (
              <div key={session.id} className="p-3 rounded-lg border">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={session.ended_at ? 'outline' : 'secondary'}>
                    {session.ended_at ? tx('k47') : tx('k48')}
                  </Badge>
                  {session.entry_type === 'manual_admin' && (
                    <Badge className="bg-yellow-100 text-yellow-700">{tx('k49')}</Badge>
                  )}
                </div>
                <p className="text-sm mt-2">
                  {format(new Date(session.started_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                  {session.ended_at ? ` → ${format(new Date(session.ended_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {session.project_id ? (projectById.get(session.project_id)?.name || tx('k50')) : tx('k51')}
                </p>
                {session.note && <p className="text-xs text-gray-600 mt-1">{session.note}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="pt-1">
          <p className="text-sm font-semibold text-gray-700">{tx('k52')}</p>
        </div>
      )}

      {isAdmin && openSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tx('k53')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openSessions.map((session) => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{session.user_email}</p>
                  <p className="text-xs text-gray-500">
                    {tx('k54')} {format(new Date(session.started_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    {session.project_id ? ` · ${projectById.get(session.project_id)?.name || tx('k55')}` : ''}
                  </p>
                  <div className="mt-1 space-y-1">
                    {renderGpsInfo(
                      tx('k56'),
                      session.clock_in_latitude,
                      session.clock_in_longitude,
                      session.clock_in_accuracy_m,
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCloseDialogTarget(session);
                    setCloseDialogEndedAt(toLocalInputValue(new Date().toISOString()));
                    setCloseDialogReason('');
                    setCloseDialogNote('');
                  }}
                >
                  {tx('k57')}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tx('k58')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>{tx('k59')}</Label>
                <Input type="date" value={adminFilterFromDate} onChange={(event) => setAdminFilterFromDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tx('k60')}</Label>
                <Input type="date" value={adminFilterToDate} onChange={(event) => setAdminFilterToDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tx('k61')}</Label>
                <Select value={adminFilterMember} onValueChange={setAdminFilterMember}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{tx('k62')}</SelectItem>
                    {companyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_email}>
                        {getUserDisplayNameByEmail(member.user_email, allUsers)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tx('k63')}</Label>
                <Select value={adminFilterProject} onValueChange={setAdminFilterProject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{tx('k64')}</SelectItem>
                    <SelectItem value="__none__">{tx('k65')}</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    setAdminFilterFromDate(today);
                    setAdminFilterToDate(today);
                  }}
                >
                  {tx('k66')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdminFilterFromDate('');
                    setAdminFilterToDate('');
                    setAdminFilterMember('__all__');
                    setAdminFilterProject('__all__');
                  }}
                >
                  {tx('k67')}
                </Button>
                <Badge variant="outline">{filteredAdminSessions.length}</Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={filteredAdminSessions.length === 0}
                    className="bg-[#ef6144] hover:bg-[#d9553a] text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportSessions('csv')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSessions('xml')}>XML</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSessions('json')}>JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSessions('txt')}>TXT</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filteredAdminSessions.length === 0 ? (
              <p className="text-sm text-gray-600">{tx('k68')}</p>
            ) : (
              filteredAdminSessions.map((session) => (
                <div key={`admin-${session.id}`} className="p-3 rounded-lg border">
                  <p className="font-medium text-sm">{session.user_email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(session.started_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    {session.ended_at ? ` → ${format(new Date(session.ended_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.project_id ? (projectById.get(session.project_id)?.name || tx('k69')) : tx('k70')}
                  </p>
                  <div className="mt-1 space-y-1">
                    {renderGpsInfo(
                      tx('k71'),
                      session.clock_in_latitude,
                      session.clock_in_longitude,
                      session.clock_in_accuracy_m,
                    )}
                    {session.ended_at && renderGpsInfo(
                      tx('k72'),
                      session.clock_out_latitude,
                      session.clock_out_longitude,
                      session.clock_out_accuracy_m,
                    )}
                  </div>
                </div>
              ))
            )}

            {companyRecentSessions.length > 0 && (
              <p className="text-xs text-gray-500">
                {tx('k73')}: {companyRecentSessions.length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!closeDialogTarget} onOpenChange={(open) => !open && setCloseDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tx('k74')}</DialogTitle>
            <DialogDescription>
              {tx('k75')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{tx('k76')}</Label>
              <Input type="datetime-local" value={closeDialogEndedAt} onChange={(event) => setCloseDialogEndedAt(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tx('k77')}</Label>
              <Input value={closeDialogReason} onChange={(event) => setCloseDialogReason(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tx('k78')}</Label>
              <Textarea value={closeDialogNote} onChange={(event) => setCloseDialogNote(event.target.value)} rows={2} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCloseDialogTarget(null)}>{tx('k79')}</Button>
              <Button
                className="bg-[#ef6144] hover:bg-[#d9553a]"
                disabled={!closeDialogEndedAt || manualCloseMutation.isPending}
                onClick={() => manualCloseMutation.mutate()}
              >
                {manualCloseMutation.isPending ? tx('k80') : tx('k81')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
