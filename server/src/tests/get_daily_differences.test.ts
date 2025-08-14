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
import { type GetDailyDifferencesInput } from '../schema';
import { getDailyDifferences } from '../handlers/get_daily_differences';

describe('getDailyDifferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testInput: GetDailyDifferencesInput = {
    customer_id: 1,
    date: '2024-01-15'
  };

  const previousDate = '2024-01-14T00:00:00.000Z';

  it('should return empty differences when no data exists', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.customer_id).toEqual(1);
    expect(result.date).toEqual('2024-01-15');
    expect(result.zendesk_differences).toHaveLength(0);
    expect(result.jira_differences).toHaveLength(0);
  });

  it('should identify new Zendesk tickets', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create current ticket (no previous snapshot)
    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 123,
      subject: 'New ticket',
      status: 'open',
      requester: 'user@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.zendesk_differences).toHaveLength(1);
    expect(result.zendesk_differences[0]).toEqual({
      ticket_id: 123,
      subject: 'New ticket',
      current_status: 'open',
      previous_status: null,
      requester: 'user@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123',
      change_type: 'new'
    });
  });

  it('should identify Zendesk ticket status changes', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create previous snapshot
    await db.insert(zendeskTicketSnapshotsTable).values({
      ticket_id: 123,
      customer_id: 1,
      subject: 'Test ticket',
      status: 'open',
      requester: 'user@test.com',
      last_update: new Date('2024-01-14T09:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123',
      snapshot_date: new Date(previousDate)
    }).execute();

    // Create current ticket with changed status
    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 123,
      subject: 'Test ticket',
      status: 'solved',
      requester: 'user@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.zendesk_differences).toHaveLength(1);
    expect(result.zendesk_differences[0].change_type).toEqual('status_changed');
    expect(result.zendesk_differences[0].current_status).toEqual('solved');
    expect(result.zendesk_differences[0].previous_status).toEqual('open');
  });

  it('should identify updated Zendesk tickets', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create previous snapshot
    await db.insert(zendeskTicketSnapshotsTable).values({
      ticket_id: 123,
      customer_id: 1,
      subject: 'Original subject',
      status: 'open',
      requester: 'user@test.com',
      last_update: new Date('2024-01-14T09:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123',
      snapshot_date: new Date(previousDate)
    }).execute();

    // Create current ticket with updated subject
    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 123,
      subject: 'Updated subject',
      status: 'open',
      requester: 'user@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.zendesk_differences).toHaveLength(1);
    expect(result.zendesk_differences[0].change_type).toEqual('updated');
    expect(result.zendesk_differences[0].subject).toEqual('Updated subject');
  });

  it('should identify new JIRA issues', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create current issue (no previous snapshot)
    await db.insert(jiraIssuesTable).values({
      customer_id: 1,
      issue_key: 'TEST-123',
      summary: 'New issue',
      status: 'To Do',
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.jira_differences).toHaveLength(1);
    expect(result.jira_differences[0]).toEqual({
      issue_key: 'TEST-123',
      summary: 'New issue',
      current_status: 'To Do',
      previous_status: null,
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123',
      change_type: 'new'
    });
  });

  it('should identify JIRA issue status changes', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create previous snapshot
    await db.insert(jiraIssueSnapshotsTable).values({
      issue_key: 'TEST-123',
      customer_id: 1,
      summary: 'Test issue',
      status: 'To Do',
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123',
      snapshot_date: new Date(previousDate)
    }).execute();

    // Create current issue with changed status
    await db.insert(jiraIssuesTable).values({
      customer_id: 1,
      issue_key: 'TEST-123',
      summary: 'Test issue',
      status: 'In Progress',
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.jira_differences).toHaveLength(1);
    expect(result.jira_differences[0].change_type).toEqual('status_changed');
    expect(result.jira_differences[0].current_status).toEqual('In Progress');
    expect(result.jira_differences[0].previous_status).toEqual('To Do');
  });

  it('should identify JIRA issue assignee changes', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create previous snapshot
    await db.insert(jiraIssueSnapshotsTable).values({
      issue_key: 'TEST-123',
      customer_id: 1,
      summary: 'Test issue',
      status: 'To Do',
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123',
      snapshot_date: new Date(previousDate)
    }).execute();

    // Create current issue with changed assignee
    await db.insert(jiraIssuesTable).values({
      customer_id: 1,
      issue_key: 'TEST-123',
      summary: 'Test issue',
      status: 'To Do',
      assignee: 'jane.smith@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.jira_differences).toHaveLength(1);
    expect(result.jira_differences[0].change_type).toEqual('assignee_changed');
    expect(result.jira_differences[0].assignee).toEqual('jane.smith@test.com');
  });

  it('should use today\'s date when date is not provided', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    const inputWithoutDate = {
      customer_id: 1
    };

    const result = await getDailyDifferences(inputWithoutDate);
    const today = new Date().toISOString().split('T')[0];

    expect(result.date).toEqual(today);
  });

  it('should handle mixed changes for both Zendesk and JIRA', async () => {
    // Create customer
    await db.insert(customersTable).values({
      company_name: 'Test Company',
      slack_channel: '#test'
    }).execute();

    // Create Zendesk data
    await db.insert(zendeskTicketSnapshotsTable).values({
      ticket_id: 123,
      customer_id: 1,
      subject: 'Test ticket',
      status: 'open',
      requester: 'user@test.com',
      last_update: new Date('2024-01-14T09:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123',
      snapshot_date: new Date(previousDate)
    }).execute();

    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 123,
      subject: 'Test ticket',
      status: 'solved',
      requester: 'user@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123'
    }).execute();

    // Create new Zendesk ticket
    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 456,
      subject: 'Brand new ticket',
      status: 'open',
      requester: 'user2@test.com',
      last_update: new Date('2024-01-15T11:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/456'
    }).execute();

    // Create JIRA data
    await db.insert(jiraIssueSnapshotsTable).values({
      issue_key: 'TEST-123',
      customer_id: 1,
      summary: 'Test issue',
      status: 'To Do',
      assignee: 'john.doe@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123',
      snapshot_date: new Date(previousDate)
    }).execute();

    await db.insert(jiraIssuesTable).values({
      customer_id: 1,
      issue_key: 'TEST-123',
      summary: 'Test issue',
      status: 'In Progress',
      assignee: 'jane.smith@test.com',
      project: 'TEST',
      issue_url: 'https://test.atlassian.net/browse/TEST-123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    // Should have 2 Zendesk differences (1 status change, 1 new)
    expect(result.zendesk_differences).toHaveLength(2);
    
    const statusChange = result.zendesk_differences.find(d => d.change_type === 'status_changed');
    const newTicket = result.zendesk_differences.find(d => d.change_type === 'new');
    
    expect(statusChange).toBeDefined();
    expect(statusChange?.ticket_id).toEqual(123);
    expect(newTicket).toBeDefined();
    expect(newTicket?.ticket_id).toEqual(456);

    // Should have 1 JIRA difference (status changed, but since assignee also changed, 
    // it should be marked as status_changed as that's checked first)
    expect(result.jira_differences).toHaveLength(1);
    expect(result.jira_differences[0].change_type).toEqual('status_changed');
    expect(result.jira_differences[0].issue_key).toEqual('TEST-123');
  });

  it('should ignore tickets from other customers', async () => {
    // Create two customers
    await db.insert(customersTable).values([
      { company_name: 'Test Company 1', slack_channel: '#test1' },
      { company_name: 'Test Company 2', slack_channel: '#test2' }
    ]).execute();

    // Create data for customer 2 (should be ignored)
    await db.insert(zendeskTicketsTable).values({
      customer_id: 2,
      ticket_id: 999,
      subject: 'Other customer ticket',
      status: 'open',
      requester: 'other@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/999'
    }).execute();

    // Create data for customer 1 (our target)
    await db.insert(zendeskTicketsTable).values({
      customer_id: 1,
      ticket_id: 123,
      subject: 'Target customer ticket',
      status: 'open',
      requester: 'target@test.com',
      last_update: new Date('2024-01-15T10:00:00Z'),
      ticket_url: 'https://test.zendesk.com/tickets/123'
    }).execute();

    const result = await getDailyDifferences(testInput);

    expect(result.zendesk_differences).toHaveLength(1);
    expect(result.zendesk_differences[0].ticket_id).toEqual(123);
    expect(result.zendesk_differences[0].subject).toEqual('Target customer ticket');
  });
});