import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  customersTable,
  zendeskTicketsTable,
  jiraIssuesTable,
  zendeskTicketSnapshotsTable,
  jiraIssueSnapshotsTable
} from '../db/schema';
import { createDailySnapshots } from '../handlers/create_daily_snapshots';
import { eq } from 'drizzle-orm';

describe('createDailySnapshots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create empty snapshots when no tickets or issues exist', async () => {
    const result = await createDailySnapshots();

    expect(result.zendesk_snapshots).toEqual(0);
    expect(result.jira_snapshots).toEqual(0);
  });

  it('should create snapshots for Zendesk tickets only', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test Zendesk tickets
    await db.insert(zendeskTicketsTable)
      .values([
        {
          customer_id: customerId,
          ticket_id: 1001,
          subject: 'Test Ticket 1',
          status: 'open',
          requester: 'user1@test.com',
          last_update: new Date('2024-01-01T10:00:00Z'),
          ticket_url: 'https://test.zendesk.com/tickets/1001'
        },
        {
          customer_id: customerId,
          ticket_id: 1002,
          subject: 'Test Ticket 2',
          status: 'pending',
          requester: 'user2@test.com',
          last_update: new Date('2024-01-01T11:00:00Z'),
          ticket_url: 'https://test.zendesk.com/tickets/1002'
        }
      ])
      .execute();

    const result = await createDailySnapshots();

    expect(result.zendesk_snapshots).toEqual(2);
    expect(result.jira_snapshots).toEqual(0);

    // Verify snapshots were created
    const snapshots = await db.select()
      .from(zendeskTicketSnapshotsTable)
      .execute();

    expect(snapshots).toHaveLength(2);

    const snapshot1 = snapshots.find(s => s.ticket_id === 1001);
    expect(snapshot1).toBeDefined();
    expect(snapshot1?.subject).toEqual('Test Ticket 1');
    expect(snapshot1?.status).toEqual('open');
    expect(snapshot1?.requester).toEqual('user1@test.com');
    expect(snapshot1?.customer_id).toEqual(customerId);
    expect(snapshot1?.snapshot_date).toBeInstanceOf(Date);

    const snapshot2 = snapshots.find(s => s.ticket_id === 1002);
    expect(snapshot2).toBeDefined();
    expect(snapshot2?.subject).toEqual('Test Ticket 2');
    expect(snapshot2?.status).toEqual('pending');
    expect(snapshot2?.requester).toEqual('user2@test.com');
  });

  it('should create snapshots for JIRA issues only', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test JIRA issues
    await db.insert(jiraIssuesTable)
      .values([
        {
          customer_id: customerId,
          issue_key: 'TEST-101',
          summary: 'Test Issue 1',
          status: 'To Do',
          assignee: 'john.doe@test.com',
          project: 'TEST',
          issue_url: 'https://test.atlassian.net/browse/TEST-101'
        },
        {
          customer_id: customerId,
          issue_key: 'TEST-102',
          summary: 'Test Issue 2',
          status: 'In Progress',
          assignee: null,
          project: 'TEST',
          issue_url: 'https://test.atlassian.net/browse/TEST-102'
        }
      ])
      .execute();

    const result = await createDailySnapshots();

    expect(result.zendesk_snapshots).toEqual(0);
    expect(result.jira_snapshots).toEqual(2);

    // Verify snapshots were created
    const snapshots = await db.select()
      .from(jiraIssueSnapshotsTable)
      .execute();

    expect(snapshots).toHaveLength(2);

    const snapshot1 = snapshots.find(s => s.issue_key === 'TEST-101');
    expect(snapshot1).toBeDefined();
    expect(snapshot1?.summary).toEqual('Test Issue 1');
    expect(snapshot1?.status).toEqual('To Do');
    expect(snapshot1?.assignee).toEqual('john.doe@test.com');
    expect(snapshot1?.project).toEqual('TEST');
    expect(snapshot1?.customer_id).toEqual(customerId);
    expect(snapshot1?.snapshot_date).toBeInstanceOf(Date);

    const snapshot2 = snapshots.find(s => s.issue_key === 'TEST-102');
    expect(snapshot2).toBeDefined();
    expect(snapshot2?.summary).toEqual('Test Issue 2');
    expect(snapshot2?.status).toEqual('In Progress');
    expect(snapshot2?.assignee).toBeNull();
  });

  it('should create snapshots for both Zendesk tickets and JIRA issues', async () => {
    // Create test customers
    const customer1Result = await db.insert(customersTable)
      .values({
        company_name: 'Test Company 1',
        slack_channel: '#test-channel-1'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        company_name: 'Test Company 2',
        slack_channel: '#test-channel-2'
      })
      .returning()
      .execute();

    const customerId1 = customer1Result[0].id;
    const customerId2 = customer2Result[0].id;

    // Create Zendesk tickets for both customers
    await db.insert(zendeskTicketsTable)
      .values([
        {
          customer_id: customerId1,
          ticket_id: 2001,
          subject: 'Customer 1 Ticket',
          status: 'open',
          requester: 'user1@customer1.com',
          last_update: new Date('2024-01-01T10:00:00Z'),
          ticket_url: 'https://customer1.zendesk.com/tickets/2001'
        },
        {
          customer_id: customerId2,
          ticket_id: 2002,
          subject: 'Customer 2 Ticket',
          status: 'solved',
          requester: 'user1@customer2.com',
          last_update: new Date('2024-01-01T12:00:00Z'),
          ticket_url: 'https://customer2.zendesk.com/tickets/2002'
        }
      ])
      .execute();

    // Create JIRA issues for both customers
    await db.insert(jiraIssuesTable)
      .values([
        {
          customer_id: customerId1,
          issue_key: 'CUST1-201',
          summary: 'Customer 1 Issue',
          status: 'Done',
          assignee: 'dev1@company.com',
          project: 'CUST1',
          issue_url: 'https://company.atlassian.net/browse/CUST1-201'
        },
        {
          customer_id: customerId2,
          issue_key: 'CUST2-202',
          summary: 'Customer 2 Issue',
          status: 'In Review',
          assignee: 'dev2@company.com',
          project: 'CUST2',
          issue_url: 'https://company.atlassian.net/browse/CUST2-202'
        }
      ])
      .execute();

    const result = await createDailySnapshots();

    expect(result.zendesk_snapshots).toEqual(2);
    expect(result.jira_snapshots).toEqual(2);

    // Verify Zendesk snapshots
    const zendeskSnapshots = await db.select()
      .from(zendeskTicketSnapshotsTable)
      .execute();

    expect(zendeskSnapshots).toHaveLength(2);

    // Verify JIRA snapshots
    const jiraSnapshots = await db.select()
      .from(jiraIssueSnapshotsTable)
      .execute();

    expect(jiraSnapshots).toHaveLength(2);

    // Check that snapshots have consistent snapshot_date (beginning of day)
    const snapshotDate = zendeskSnapshots[0].snapshot_date;
    expect(snapshotDate.getHours()).toEqual(0);
    expect(snapshotDate.getMinutes()).toEqual(0);
    expect(snapshotDate.getSeconds()).toEqual(0);
    expect(snapshotDate.getMilliseconds()).toEqual(0);

    // All snapshots should have the same date
    zendeskSnapshots.forEach(snapshot => {
      expect(snapshot.snapshot_date.getTime()).toEqual(snapshotDate.getTime());
    });

    jiraSnapshots.forEach(snapshot => {
      expect(snapshot.snapshot_date.getTime()).toEqual(snapshotDate.getTime());
    });
  });

  it('should preserve all ticket and issue data in snapshots', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Data Preservation Test',
        slack_channel: '#data-test'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const testDate = new Date('2024-01-15T14:30:45Z');

    // Create ticket with specific data to verify preservation
    await db.insert(zendeskTicketsTable)
      .values({
        customer_id: customerId,
        ticket_id: 9999,
        subject: 'Critical Data Preservation Test',
        status: 'urgent',
        requester: 'critical@preservation.com',
        last_update: testDate,
        ticket_url: 'https://preservation.zendesk.com/tickets/9999'
      })
      .execute();

    // Create issue with specific data to verify preservation
    await db.insert(jiraIssuesTable)
      .values({
        customer_id: customerId,
        issue_key: 'PRESERVE-999',
        summary: 'Critical Issue Data Preservation',
        status: 'Critical',
        assignee: 'critical@assign.com',
        project: 'PRESERVE',
        issue_url: 'https://preserve.atlassian.net/browse/PRESERVE-999'
      })
      .execute();

    await createDailySnapshots();

    // Verify ticket data preservation
    const ticketSnapshot = await db.select()
      .from(zendeskTicketSnapshotsTable)
      .where(eq(zendeskTicketSnapshotsTable.ticket_id, 9999))
      .execute();

    expect(ticketSnapshot).toHaveLength(1);
    const ticket = ticketSnapshot[0];
    expect(ticket.ticket_id).toEqual(9999);
    expect(ticket.customer_id).toEqual(customerId);
    expect(ticket.subject).toEqual('Critical Data Preservation Test');
    expect(ticket.status).toEqual('urgent');
    expect(ticket.requester).toEqual('critical@preservation.com');
    expect(ticket.last_update).toEqual(testDate);
    expect(ticket.ticket_url).toEqual('https://preservation.zendesk.com/tickets/9999');

    // Verify issue data preservation
    const issueSnapshot = await db.select()
      .from(jiraIssueSnapshotsTable)
      .where(eq(jiraIssueSnapshotsTable.issue_key, 'PRESERVE-999'))
      .execute();

    expect(issueSnapshot).toHaveLength(1);
    const issue = issueSnapshot[0];
    expect(issue.issue_key).toEqual('PRESERVE-999');
    expect(issue.customer_id).toEqual(customerId);
    expect(issue.summary).toEqual('Critical Issue Data Preservation');
    expect(issue.status).toEqual('Critical');
    expect(issue.assignee).toEqual('critical@assign.com');
    expect(issue.project).toEqual('PRESERVE');
    expect(issue.issue_url).toEqual('https://preserve.atlassian.net/browse/PRESERVE-999');
  });
});