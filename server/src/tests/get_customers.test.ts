import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer inputs
const testCustomer1: CreateCustomerInput = {
  company_name: 'Test Company 1',
  slack_channel: '#test-channel-1',
  zendesk_subdomain: 'testcompany1',
  zendesk_api_token: 'zendesk-token-1',
  zendesk_email: 'zendesk@testcompany1.com',
  jira_host: 'https://testcompany1.atlassian.net',
  jira_api_token: 'jira-token-1',
  jira_email: 'jira@testcompany1.com'
};

const testCustomer2: CreateCustomerInput = {
  company_name: 'Test Company 2',
  slack_channel: '#test-channel-2',
  zendesk_subdomain: null,
  zendesk_api_token: null,
  zendesk_email: null,
  jira_host: null,
  jira_api_token: null,
  jira_email: null
};

const testCustomer3: CreateCustomerInput = {
  company_name: 'Test Company 3',
  slack_channel: '#test-channel-3',
  zendesk_subdomain: 'testcompany3',
  zendesk_api_token: 'zendesk-token-3',
  zendesk_email: 'zendesk@testcompany3.com',
  jira_host: null,
  jira_api_token: null,
  jira_email: null
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all customers when they exist', async () => {
    // Insert test customers
    await db.insert(customersTable)
      .values([testCustomer1, testCustomer2, testCustomer3])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Verify all customers are returned
    const companyNames = result.map(c => c.company_name);
    expect(companyNames).toContain('Test Company 1');
    expect(companyNames).toContain('Test Company 2');
    expect(companyNames).toContain('Test Company 3');
  });

  it('should return customers with all required fields', async () => {
    // Insert a customer with all fields populated
    await db.insert(customersTable)
      .values(testCustomer1)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify all fields are present and have correct types
    expect(typeof customer.id).toBe('number');
    expect(customer.company_name).toBe('Test Company 1');
    expect(customer.slack_channel).toBe('#test-channel-1');
    expect(customer.zendesk_subdomain).toBe('testcompany1');
    expect(customer.zendesk_api_token).toBe('zendesk-token-1');
    expect(customer.zendesk_email).toBe('zendesk@testcompany1.com');
    expect(customer.jira_host).toBe('https://testcompany1.atlassian.net');
    expect(customer.jira_api_token).toBe('jira-token-1');
    expect(customer.jira_email).toBe('jira@testcompany1.com');
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);
  });

  it('should handle customers with nullable fields', async () => {
    // Insert a customer with nullable fields set to null
    await db.insert(customersTable)
      .values(testCustomer2)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify nullable fields are properly handled
    expect(customer.company_name).toBe('Test Company 2');
    expect(customer.slack_channel).toBe('#test-channel-2');
    expect(customer.zendesk_subdomain).toBeNull();
    expect(customer.zendesk_api_token).toBeNull();
    expect(customer.zendesk_email).toBeNull();
    expect(customer.jira_host).toBeNull();
    expect(customer.jira_api_token).toBeNull();
    expect(customer.jira_email).toBeNull();
  });

  it('should return customers in descending order by creation date', async () => {
    // Insert customers with small delays to ensure different timestamps
    await db.insert(customersTable)
      .values(testCustomer1)
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(customersTable)
      .values(testCustomer2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(customersTable)
      .values(testCustomer3)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);

    // Verify customers are ordered by creation date (newest first)
    expect(result[0].company_name).toBe('Test Company 3'); // Last inserted
    expect(result[1].company_name).toBe('Test Company 2'); // Second inserted
    expect(result[2].company_name).toBe('Test Company 1'); // First inserted

    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThanOrEqual(result[2].created_at.getTime());
  });

  it('should handle large number of customers efficiently', async () => {
    // Create an array of 50 test customers
    const manyCustomers = Array.from({ length: 50 }, (_, i) => ({
      company_name: `Test Company ${i + 1}`,
      slack_channel: `#test-channel-${i + 1}`,
      zendesk_subdomain: i % 3 === 0 ? `testcompany${i + 1}` : null,
      zendesk_api_token: i % 3 === 0 ? `token-${i + 1}` : null,
      zendesk_email: i % 3 === 0 ? `test${i + 1}@example.com` : null,
      jira_host: i % 2 === 0 ? `https://company${i + 1}.atlassian.net` : null,
      jira_api_token: i % 2 === 0 ? `jira-token-${i + 1}` : null,
      jira_email: i % 2 === 0 ? `jira${i + 1}@example.com` : null
    }));

    await db.insert(customersTable)
      .values(manyCustomers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(50);
    expect(Array.isArray(result)).toBe(true);

    // Verify all customers have required fields
    result.forEach(customer => {
      expect(typeof customer.id).toBe('number');
      expect(typeof customer.company_name).toBe('string');
      expect(typeof customer.slack_channel).toBe('string');
      expect(customer.created_at).toBeInstanceOf(Date);
      expect(customer.updated_at).toBeInstanceOf(Date);
    });
  });
});