import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get all users
        const allUsers = await base44.entities.User.list();
        
        const defaultTourState = {
            onboarding_completed: false,
            onboarding_dismissed: false,
            projects_completed: false,
            projects_dismissed: false,
            companies_completed: false,
            companies_dismissed: false,
        };

        let updatedCount = 0;
        let skippedCount = 0;

        // Update users that don't have tour_state
        for (const userRecord of allUsers) {
            if (!userRecord.tour_state) {
                await base44.entities.User.update(userRecord.id, {
                    tour_state: defaultTourState,
                });
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        return Response.json({
            success: true,
            message: `Tour states initialized successfully`,
            total_users: allUsers.length,
            updated: updatedCount,
            skipped: skippedCount,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});