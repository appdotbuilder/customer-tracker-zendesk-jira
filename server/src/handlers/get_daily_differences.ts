import { db } from '../db';
import { 
  zendeskTicketsTable, 
  jiraIssuesTable, 
  zendeskTicketSnapshotsTable, 
  jiraIssueSnapshotsTable 
} from '../db/schema';
import { eq, and, SQL } from 'drizzle-orm';
import { 
  type GetDailyDifferencesInput, 
  type DailyDifferences, 
  type ZendeskTicketDifference,
  type JiraIssueDifference
} from '../schema';

export async function getDailyDifferences(input: GetDailyDifferencesInput): Promise<DailyDifferences> {
  try {
    const targetDate = input.date || new Date().toISOString().split('T')[0];
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split('T')[0];

    // Get current Zendesk tickets for the customer
    const currentZendeskTickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, input.customer_id))
      .execute();

    // Get previous day snapshots for Zendesk tickets
    const previousZendeskSnapshots = await db.select()
      .from(zendeskTicketSnapshotsTable)
      .where(
        and(
          eq(zendeskTicketSnapshotsTable.customer_id, input.customer_id),
          eq(zendeskTicketSnapshotsTable.snapshot_date, new Date(previousDateString + 'T00:00:00.000Z'))
        )
      )
      .execute();

    // Get current JIRA issues for the customer
    const currentJiraIssues = await db.select()
      .from(jiraIssuesTable)
      .where(eq(jiraIssuesTable.customer_id, input.customer_id))
      .execute();

    // Get previous day snapshots for JIRA issues
    const previousJiraSnapshots = await db.select()
      .from(jiraIssueSnapshotsTable)
      .where(
        and(
          eq(jiraIssueSnapshotsTable.customer_id, input.customer_id),
          eq(jiraIssueSnapshotsTable.snapshot_date, new Date(previousDateString + 'T00:00:00.000Z'))
        )
      )
      .execute();

    // Calculate Zendesk differences
    const zendeskDifferences: ZendeskTicketDifference[] = [];
    const previousZendeskMap = new Map(
      previousZendeskSnapshots.map(snapshot => [snapshot.ticket_id, snapshot])
    );

    for (const currentTicket of currentZendeskTickets) {
      const previousTicket = previousZendeskMap.get(currentTicket.ticket_id);

      if (!previousTicket) {
        // New ticket
        zendeskDifferences.push({
          ticket_id: currentTicket.ticket_id,
          subject: currentTicket.subject,
          current_status: currentTicket.status,
          previous_status: null,
          requester: currentTicket.requester,
          last_update: currentTicket.last_update,
          ticket_url: currentTicket.ticket_url,
          change_type: 'new'
        });
      } else if (currentTicket.status !== previousTicket.status) {
        // Status changed
        zendeskDifferences.push({
          ticket_id: currentTicket.ticket_id,
          subject: currentTicket.subject,
          current_status: currentTicket.status,
          previous_status: previousTicket.status,
          requester: currentTicket.requester,
          last_update: currentTicket.last_update,
          ticket_url: currentTicket.ticket_url,
          change_type: 'status_changed'
        });
      } else if (
        currentTicket.subject !== previousTicket.subject ||
        currentTicket.last_update.getTime() !== previousTicket.last_update.getTime()
      ) {
        // Updated ticket (subject or last_update changed)
        zendeskDifferences.push({
          ticket_id: currentTicket.ticket_id,
          subject: currentTicket.subject,
          current_status: currentTicket.status,
          previous_status: previousTicket.status,
          requester: currentTicket.requester,
          last_update: currentTicket.last_update,
          ticket_url: currentTicket.ticket_url,
          change_type: 'updated'
        });
      }
    }

    // Calculate JIRA differences
    const jiraDifferences: JiraIssueDifference[] = [];
    const previousJiraMap = new Map(
      previousJiraSnapshots.map(snapshot => [snapshot.issue_key, snapshot])
    );

    for (const currentIssue of currentJiraIssues) {
      const previousIssue = previousJiraMap.get(currentIssue.issue_key);

      if (!previousIssue) {
        // New issue
        jiraDifferences.push({
          issue_key: currentIssue.issue_key,
          summary: currentIssue.summary,
          current_status: currentIssue.status,
          previous_status: null,
          assignee: currentIssue.assignee,
          project: currentIssue.project,
          issue_url: currentIssue.issue_url,
          change_type: 'new'
        });
      } else if (currentIssue.status !== previousIssue.status) {
        // Status changed
        jiraDifferences.push({
          issue_key: currentIssue.issue_key,
          summary: currentIssue.summary,
          current_status: currentIssue.status,
          previous_status: previousIssue.status,
          assignee: currentIssue.assignee,
          project: currentIssue.project,
          issue_url: currentIssue.issue_url,
          change_type: 'status_changed'
        });
      } else if (currentIssue.assignee !== previousIssue.assignee) {
        // Assignee changed
        jiraDifferences.push({
          issue_key: currentIssue.issue_key,
          summary: currentIssue.summary,
          current_status: currentIssue.status,
          previous_status: previousIssue.status,
          assignee: currentIssue.assignee,
          project: currentIssue.project,
          issue_url: currentIssue.issue_url,
          change_type: 'assignee_changed'
        });
      } else if (currentIssue.summary !== previousIssue.summary) {
        // Updated issue (summary changed)
        jiraDifferences.push({
          issue_key: currentIssue.issue_key,
          summary: currentIssue.summary,
          current_status: currentIssue.status,
          previous_status: previousIssue.status,
          assignee: currentIssue.assignee,
          project: currentIssue.project,
          issue_url: currentIssue.issue_url,
          change_type: 'updated'
        });
      }
    }

    return {
      customer_id: input.customer_id,
      date: targetDate,
      zendesk_differences: zendeskDifferences,
      jira_differences: jiraDifferences
    };
  } catch (error) {
    console.error('Failed to get daily differences:', error);
    throw error;
  }
}