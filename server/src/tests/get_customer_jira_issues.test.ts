import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, jiraIssuesTable } from '../db/schema';
import { type GetCustomerByIdInput } from '../schema';
import { getCustomerJiraIssues } from '../handlers/get_customer_jira_issues';

// Test input
const testInput: GetCustomerByIdInput = {
  id: 1
};

describe('getCustomerJiraIssues', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return JIRA issues for a valid customer', async () => {
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
    const testIssue1 = {
      customer_id: customerId,
      issue_key: 'TEST-123',
      summary: 'Test issue 1',
      status: 'In Progress',
      assignee: 'john.doe@example.com',
      project: 'TEST',
      issue_url: 'https://example.atlassian.net/browse/TEST-123'
    };

    const testIssue2 = {
      customer_id: customerId,
      issue_key: 'TEST-456',
      summary: 'Test issue 2',
      status: 'Done',
      assignee: null,
      project: 'TEST',
      issue_url: 'https://example.atlassian.net/browse/TEST-456'
    };

    await db.insert(jiraIssuesTable)
      .values([testIssue1, testIssue2])
      .execute();

    // Test the handler
    const result = await getCustomerJiraIssues({ id: customerId });

    expect(result).toHaveLength(2);
    
    // Verify first issue
    const issue1 = result.find(issue => issue.issue_key === 'TEST-123');
    expect(issue1).toBeDefined();
    expect(issue1!.summary).toEqual('Test issue 1');
    expect(issue1!.status).toEqual('In Progress');
    expect(issue1!.assignee).toEqual('john.doe@example.com');
    expect(issue1!.project).toEqual('TEST');
    expect(issue1!.issue_url).toEqual('https://example.atlassian.net/browse/TEST-123');
    expect(issue1!.customer_id).toEqual(customerId);
    expect(issue1!.id).toBeDefined();
    expect(issue1!.created_at).toBeInstanceOf(Date);
    expect(issue1!.updated_at).toBeInstanceOf(Date);

    // Verify second issue
    const issue2 = result.find(issue => issue.issue_key === 'TEST-456');
    expect(issue2).toBeDefined();
    expect(issue2!.summary).toEqual('Test issue 2');
    expect(issue2!.status).toEqual('Done');
    expect(issue2!.assignee).toBeNull();
    expect(issue2!.project).toEqual('TEST');
    expect(issue2!.issue_url).toEqual('https://example.atlassian.net/browse/TEST-456');
    expect(issue2!.customer_id).toEqual(customerId);
  });

  it('should return empty array for customer with no JIRA issues', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Test the handler
    const result = await getCustomerJiraIssues({ id: customerId });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return JIRA issues for the specified customer', async () => {
    // Create two test customers
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

    const customer1Id = customer1Result[0].id;
    const customer2Id = customer2Result[0].id;

    // Create JIRA issues for both customers
    await db.insert(jiraIssuesTable)
      .values([
        {
          customer_id: customer1Id,
          issue_key: 'CUST1-123',
          summary: 'Customer 1 issue',
          status: 'Open',
          assignee: 'user1@example.com',
          project: 'CUST1',
          issue_url: 'https://example.atlassian.net/browse/CUST1-123'
        },
        {
          customer_id: customer2Id,
          issue_key: 'CUST2-456',
          summary: 'Customer 2 issue',
          status: 'Closed',
          assignee: 'user2@example.com',
          project: 'CUST2',
          issue_url: 'https://example.atlassian.net/browse/CUST2-456'
        }
      ])
      .execute();

    // Test the handler for customer 1
    const result = await getCustomerJiraIssues({ id: customer1Id });

    expect(result).toHaveLength(1);
    expect(result[0].issue_key).toEqual('CUST1-123');
    expect(result[0].customer_id).toEqual(customer1Id);
    expect(result[0].summary).toEqual('Customer 1 issue');
  });

  it('should throw error for non-existent customer', async () => {
    const nonExistentCustomerId = 999;

    await expect(
      getCustomerJiraIssues({ id: nonExistentCustomerId })
    ).rejects.toThrow(/Customer with id 999 not found/i);
  });

  it('should handle different JIRA issue statuses correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create JIRA issues with different statuses
    const testIssues = [
      {
        customer_id: customerId,
        issue_key: 'STAT-1',
        summary: 'Open issue',
        status: 'Open',
        assignee: 'dev1@example.com',
        project: 'STAT',
        issue_url: 'https://example.atlassian.net/browse/STAT-1'
      },
      {
        customer_id: customerId,
        issue_key: 'STAT-2',
        summary: 'In Progress issue',
        status: 'In Progress',
        assignee: 'dev2@example.com',
        project: 'STAT',
        issue_url: 'https://example.atlassian.net/browse/STAT-2'
      },
      {
        customer_id: customerId,
        issue_key: 'STAT-3',
        summary: 'Done issue',
        status: 'Done',
        assignee: null,
        project: 'STAT',
        issue_url: 'https://example.atlassian.net/browse/STAT-3'
      }
    ];

    await db.insert(jiraIssuesTable)
      .values(testIssues)
      .execute();

    // Test the handler
    const result = await getCustomerJiraIssues({ id: customerId });

    expect(result).toHaveLength(3);
    
    const statuses = result.map(issue => issue.status);
    expect(statuses).toContain('Open');
    expect(statuses).toContain('In Progress');
    expect(statuses).toContain('Done');

    // Verify each issue maintains its correct data
    result.forEach(issue => {
      expect(issue.customer_id).toEqual(customerId);
      expect(issue.issue_key).toMatch(/^STAT-\d+$/);
      expect(issue.project).toEqual('STAT');
    });
  });
});