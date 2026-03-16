const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const parseHours = (session) => {
  if (!session?.started_at || !session?.ended_at) return 0;
  const start = new Date(session.started_at);
  const end = new Date(session.ended_at);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
};

const pickRate = (rates, sessionDate, companyId, userEmail) => {
  const day = toDateOnly(sessionDate);
  if (!day) return null;

  const candidates = rates.filter((rate) => {
    if (rate.company_id !== companyId) return false;
    if (rate.user_email && rate.user_email !== userEmail) return false;
    if (rate.valid_from && rate.valid_from > day) return false;
    if (rate.valid_to && rate.valid_to < day) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (a.user_email && !b.user_email) return -1;
    if (!a.user_email && b.user_email) return 1;
    if (a.valid_from === b.valid_from) return 0;
    return a.valid_from > b.valid_from ? -1 : 1;
  });

  return sorted[0];
};

const computeLaborSyncCandidates = ({ workSessions, costEntries, laborRates, projectId, description }) => {
  const existingSourceIds = new Set(
    costEntries
      .filter((entry) => entry.source_type === 'work_session' && entry.source_id)
      .map((entry) => entry.source_id),
  );

  return workSessions
    .filter((session) => session.id && session.ended_at && !existingSourceIds.has(session.id))
    .map((session) => {
      const hours = parseHours(session);
      const rate = pickRate(laborRates, session.started_at, session.company_id, session.user_email);
      if (hours <= 0 || !rate) return null;
      const amount = hours * Number(rate.hourly_cost || 0);
      if (amount <= 0) return null;

      return {
        project_id: projectId,
        company_id: session.company_id || null,
        cost_type: 'labor',
        description,
        amount,
        quantity: Number(hours.toFixed(2)),
        unit_cost: Number(rate.hourly_cost || 0),
        entry_date: toDateOnly(session.started_at),
        source_type: 'work_session',
        source_id: session.id,
        status: 'recorded',
        notes: `${session.user_email || ''}`.trim() || null,
      };
    })
    .filter(Boolean);
};

export {
  toDateOnly,
  parseHours,
  pickRate,
  computeLaborSyncCandidates,
};
