export const getEventNotificationContext = ({
  ownerType = 'personal',
  ownerCompanyId = null,
  contextType = null,
  contextCompanyId = null,
} = {}) => {
  const resolvedContextType = contextType || (ownerType === 'company' ? 'company' : 'personal');

  return {
    context_type: resolvedContextType,
    context_company_id: resolvedContextType === 'company'
      ? contextCompanyId || ownerCompanyId || null
      : null,
  };
};

export const buildEventNotificationPayload = ({
  ownerType = 'personal',
  ownerCompanyId = null,
  contextType = null,
  contextCompanyId = null,
  userEmail,
  type,
  title,
  message,
  relatedEventId = null,
}) => ({
  user_email: userEmail,
  ...getEventNotificationContext({ ownerType, ownerCompanyId, contextType, contextCompanyId }),
  type,
  title,
  message,
  related_event_id: relatedEventId,
  is_read: false,
});