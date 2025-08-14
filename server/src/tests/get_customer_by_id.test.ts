import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomerByIdInput, type CreateCustomerInput } from '../schema';
import { getCustomerById } from '../handlers/get_customer_by_id';
import { eq } from 'drizzle-orm';

// Test input for creating a customer
const testCustomerInput: CreateCustomerInput = {
  company_name: 'Acme Corp',
  slack_channel: '#acme-support',
  zendesk_subdomain: 'acme',
  zendesk_api_token: 'zendesk-token-123',
  zendesk_email: 'support@acme.com',
  jira_host: 'acme.atlassian.net',
  jira_api_token: 'jira-token-456',
  jira_email: 'admin@acme.com'
};

describe('getCustomerById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return customer when found', async () => {
    // Create a test customer
    const insertResult = await db.insert(customersTable)
      .values({
        company_name: testCustomerInput.company_name,
        slack_channel: testCustomerInput.slack_channel,
        zendesk_subdomain: testCustomerInput.zendesk_subdomain,
        zendesk_api_token: testCustomerInput.zendesk_api_token,
        zendesk_email: testCustomerInput.zendesk_email,
        jira_host: testCustomerInput.jira_host,
        jira_api_token: testCustomerInput.jira_api_token,
        jira_email: testCustomerInput.jira_email
      })
      .returning()
      .execute();

    const createdCustomer = insertResult[0];

    // Test the handler
    const input: GetCustomerByIdInput = { id: createdCustomer.id };
    const result = await getCustomerById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.company_name).toEqual('Acme Corp');
    expect(result!.slack_channel).toEqual('#acme-support');
    expect(result!.zendesk_subdomain).toEqual('acme');
    expect(result!.zendesk_api_token).toEqual('zendesk-token-123');
    expect(result!.zendesk_email).toEqual('support@acme.com');
    expect(result!.jira_host).toEqual('acme.atlassian.net');
    expect(result!.jira_api_token).toEqual('jira-token-456');
    expect(result!.jira_email).toEqual('admin@acme.com');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when customer not found', async () => {
    const input: GetCustomerByIdInput = { id: 999 };
    const result = await getCustomerById(input);

    expect(result).toBeNull();
  });

  it('should handle customer with nullable fields', async () => {
    // Create a customer with minimal required fields
    const minimalInput = {
      company_name: 'Minimal Corp',
      slack_channel: '#minimal-support',
      zendesk_subdomain: null,
      zendesk_api_token: null,
      zendesk_email: null,
      jira_host: null,
      jira_api_token: null,
      jira_email: null
    };

    const insertResult = await db.insert(customersTable)
      .values(minimalInput)
      .returning()
      .execute();

    const createdCustomer = insertResult[0];

    // Test the handler
    const input: GetCustomerByIdInput = { id: createdCustomer.id };
    const result = await getCustomerById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.company_name).toEqual('Minimal Corp');
    expect(result!.slack_channel).toEqual('#minimal-support');
    expect(result!.zendesk_subdomain).toBeNull();
    expect(result!.zendesk_api_token).toBeNull();
    expect(result!.zendesk_email).toBeNull();
    expect(result!.jira_host).toBeNull();
    expect(result!.jira_api_token).toBeNull();
    expect(result!.jira_email).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify customer exists in database after retrieval', async () => {
    // Create a test customer
    const insertResult = await db.insert(customersTable)
      .values({
        company_name: testCustomerInput.company_name,
        slack_channel: testCustomerInput.slack_channel,
        zendesk_subdomain: testCustomerInput.zendesk_subdomain,
        zendesk_api_token: testCustomerInput.zendesk_api_token,
        zendesk_email: testCustomerInput.zendesk_email,
        jira_host: testCustomerInput.jira_host,
        jira_api_token: testCustomerInput.jira_api_token,
        jira_email: testCustomerInput.jira_email
      })
      .returning()
      .execute();

    const createdCustomer = insertResult[0];

    // Retrieve using handler
    const input: GetCustomerByIdInput = { id: createdCustomer.id };
    const result = await getCustomerById(input);

    // Verify customer still exists in database with direct query
    const dbCustomers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(dbCustomers).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbCustomers[0].id);
    expect(result!.company_name).toEqual(dbCustomers[0].company_name);
  });
});