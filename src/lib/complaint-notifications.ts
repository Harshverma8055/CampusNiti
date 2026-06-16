/**
 * Complaint notification payloads — wire to sendPushToUser / sendPushToUsers
 * from src/lib/webpush.ts
 */
import type { PushPayload } from './webpush';

export const ComplaintNotifications = {
    approved: (id: string): PushPayload => ({
        title: '✅ Complaint Approved',
        body: 'Your campus complaint is now live and visible to all students.',
        url: `/student/complaints/${id}`,
        tag: `complaint-approved-${id}`,
    }),

    rejected: (id: string, reason: string): PushPayload => ({
        title: '❌ Complaint Rejected',
        body: `Reason: ${reason.slice(0, 100)}`,
        url: `/student/complaints/${id}`,
        tag: `complaint-rejected-${id}`,
    }),

    assigned: (id: string, staffName: string): PushPayload => ({
        title: '👷 Assigned to Maintenance',
        body: `Your complaint has been assigned to ${staffName}.`,
        url: `/student/complaints/${id}`,
        tag: `complaint-assigned-${id}`,
    }),

    statusChanged: (id: string, newStatus: string): PushPayload => ({
        title: `🔄 Complaint Update`,
        body: `Status changed to: ${newStatus.replace(/_/g, ' ')}`,
        url: `/student/complaints/${id}`,
        tag: `complaint-status-${id}`,
    }),

    resolved: (id: string): PushPayload => ({
        title: '🎉 Issue Resolved!',
        body: 'A campus issue you reported/follow has been fixed. See before/after photos.',
        url: `/student/complaints/${id}`,
        tag: `complaint-resolved-${id}`,
    }),

    emergency: (id: string, title: string): PushPayload => ({
        title: '🚨 EMERGENCY CAMPUS ISSUE',
        body: title,
        url: `/admin/complaints/${id}`,
        tag: `emergency-${id}`,
        requireInteraction: true,
    }),

    trending: (id: string): PushPayload => ({
        title: '🔥 Your Complaint is Trending!',
        body: 'Your complaint is gaining community upvotes.',
        url: `/student/complaints/${id}`,
        tag: `trending-${id}`,
    }),

    newComplaintToAdmin: (id: string, zone: string): PushPayload => ({
        title: '📋 New Complaint Submitted',
        body: `A new campus issue has been reported in ${zone.replace(/_/g, ' ')}.`,
        url: `/admin/complaints/${id}`,
        tag: `new-complaint-${id}`,
    }),

    slaBreaching: (id: string, hoursLeft: number): PushPayload => ({
        title: '⏰ SLA Deadline Approaching',
        body: `A complaint SLA will breach in ${hoursLeft} hours. Assign staff now.`,
        url: `/admin/complaints/${id}`,
        tag: `sla-warning-${id}`,
        requireInteraction: true,
    }),
};
