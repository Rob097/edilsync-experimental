import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DEFAULT_PREFERENCES = {
  project_invite: { notification: true, email: true },
  company_invite: { notification: true, email: true },
  task_assigned: { notification: true, email: false },
  task_status_changed: { notification: true, email: false },
  change_request_assigned: { notification: true, email: true },
  change_request_status_changed: { notification: true, email: false },
  milestone_status_changed: { notification: true, email: false },
  event_invite: { notification: true, email: true },
  event_updated: { notification: true, email: true },
  event_cancelled: { notification: true, email: true },
  message_mention: { notification: true, email: false },
  document_comment: { notification: true, email: false },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const {
      action_type,
      recipient_email,
      context_type,
      context_company_id,
      notification_data,
      email_data,
    } = payload;

    // Validate required fields
    if (!action_type || !recipient_email) {
      return Response.json(
        { error: 'Missing required fields: action_type, recipient_email' },
        { status: 400 }
      );
    }
    
    // At least one of notification_data or email_data must be provided
    if (!notification_data && !email_data) {
      return Response.json(
        { error: 'At least one of notification_data or email_data must be provided' },
        { status: 400 }
      );
    }

    // Get or create user preferences
    let preferences = await base44.asServiceRole.entities.NotificationPreference.filter({
      user_email: recipient_email,
    });

    let userPrefs;
    if (preferences.length === 0) {
      // Create default preferences for this user
      const newPref = await base44.asServiceRole.entities.NotificationPreference.create({
        user_email: recipient_email,
        preferences: DEFAULT_PREFERENCES,
      });
      userPrefs = newPref.preferences;
    } else {
      userPrefs = preferences[0].preferences;
    }

    const actionPrefs = userPrefs[action_type] || DEFAULT_PREFERENCES[action_type] || { notification: false, email: false };

    const results = {
      notification_sent: false,
      email_sent: false,
    };

    // Send notification if enabled and notification_data is provided
    if (notification_data && actionPrefs.notification) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: recipient_email,
        context_type: context_type || 'personal',
        context_company_id: context_company_id || null,
        type: notification_data.type,
        title: notification_data.title,
        message: notification_data.message,
        related_event_id: notification_data.related_event_id || null,
        is_read: false,
      });
      results.notification_sent = true;
    }

    // Send email if enabled and email_data is provided
    if (actionPrefs.email && email_data) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient_email,
        subject: email_data.subject,
        body: email_data.body,
        from_name: email_data.from_name || 'EdilSync',
      });
      results.email_sent = true;
    }

    return Response.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Error sending notification/email:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});