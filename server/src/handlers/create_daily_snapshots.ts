import { db } from '../db';
import { 
  zendeskTicketsTable,
  jiraIssuesTable,
  zendeskTicketSnapshotsTable,
  jiraIssueSnapshotsTable
} from '../db/schema';

export async function createDailySnapshots(): Promise<{ zendesk_snapshots: number; jira_snapshots: number }> {
  try {
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0); // Set to beginning of day for consistent snapshots

    // Get all current Zendesk tickets
    const zendeskTickets = await db.select()
      .from(zendeskTicketsTable)
      .execute();

    // Create snapshots for Zendesk tickets
    let zendeskSnapshotCount = 0;
    if (zendeskTickets.length > 0) {
      const zendeskSnapshots = zendeskTickets.map(ticket => ({
        ticket_id: ticket.ticket_id,
        customer_id: ticket.customer_id,
        subject: ticket.subject,
        status: ticket.status,
        requester: ticket.requester,
        last_update: ticket.last_update,
        ticket_url: ticket.ticket_url,
        snapshot_date: snapshotDate
      }));

      const zendeskResult = await db.insert(zendeskTicketSnapshotsTable)
        .values(zendeskSnapshots)
        .returning()
        .execute();

      zendeskSnapshotCount = zendeskResult.length;
    }

    // Get all current JIRA issues
    const jiraIssues = await db.select()
      .from(jiraIssuesTable)
      .execute();

    // Create snapshots for JIRA issues
    let jiraSnapshotCount = 0;
    if (jiraIssues.length > 0) {
      const jiraSnapshots = jiraIssues.map(issue => ({
        issue_key: issue.issue_key,
        customer_id: issue.customer_id,
        summary: issue.summary,
        status: issue.status,
        assignee: issue.assignee,
        project: issue.project,
        issue_url: issue.issue_url,
        snapshot_date: snapshotDate
      }));

      const jiraResult = await db.insert(jiraIssueSnapshotsTable)
        .values(jiraSnapshots)
        .returning()
        .execute();

      jiraSnapshotCount = jiraResult.length;
    }

    return {
      zendesk_snapshots: zendeskSnapshotCount,
      jira_snapshots: jiraSnapshotCount
    };
  } catch (error) {
    console.error('Daily snapshot creation failed:', error);
    throw error;
  }
}