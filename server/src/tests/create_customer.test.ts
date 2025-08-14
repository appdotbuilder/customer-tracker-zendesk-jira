import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateCustomerInput = {
  company_name: 'Acme Corporation',
  slack_channel: '#acme-support',
  zendesk_subdomain: 'acme-corp',
  zendesk_api_token: 'zd_token_12345',
  zendesk_email: 'support@acme.com',
  jira_host: 'acme.atlassian.net',
  jira_api_token: 'jira_token_67890',
  jira_email: 'jira@acme.com'
};

// Test input with nullable fields set to null
const testInputWithNulls: CreateCustomerInput = {
  company_name: 'Minimal Corp',
  slack_channel: '#minimal-support',
  zendesk_subdomain: null,
  zendesk_api_token: null,
  zendesk_email: null,
  jira_host: null,
  jira_api_token: null,
  jira_email: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields populated', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.company_name).toEqual('Acme Corporation');
    expect(result.slack_channel).toEqual('#acme-support');
    expect(result.zendesk_subdomain).toEqual('acme-corp');
    expect(result.zendesk_api_token).toEqual('zd_token_12345');
    expect(result.zendesk_email).toEqual('support@acme.com');
    expect(result.jira_host).toEqual('acme.atlassian.net');
    expect(result.jira_api_token).toEqual('jira_token_67890');
    expect(result.jira_email).toEqual('jira@acme.com');
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with nullable fields set to null', async () => {
    const result = await createCustomer(testInputWithNulls);

    // Validate required fields
    expect(result.company_name).toEqual('Minimal Corp');
    expect(result.slack_channel).toEqual('#minimal-support');
    
    // Validate nullable fields are properly null
    expect(result.zendesk_subdomain).toBeNull();
    expect(result.zendesk_api_token).toBeNull();
    expect(result.zendesk_email).toBeNull();
    expect(result.jira_host).toBeNull();
    expect(result.jira_api_token).toBeNull();
    expect(result.jira_email).toBeNull();
    
    // Validate generated fields
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query database to verify record was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    const savedCustomer = customers[0];
    
    expect(savedCustomer.company_name).toEqual('Acme Corporation');
    expect(savedCustomer.slack_channel).toEqual('#acme-support');
    expect(savedCustomer.zendesk_subdomain).toEqual('acme-corp');
    expect(savedCustomer.zendesk_api_token).toEqual('zd_token_12345');
    expect(savedCustomer.zendesk_email).toEqual('support@acme.com');
    expect(savedCustomer.jira_host).toEqual('acme.atlassian.net');
    expect(savedCustomer.jira_api_token).toEqual('jira_token_67890');
    expect(savedCustomer.jira_email).toEqual('jira@acme.com');
    expect(savedCustomer.created_at).toBeInstanceOf(Date);
    expect(savedCustomer.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple customers with unique IDs', async () => {
    const customer1 = await createCustomer(testInput);
    const customer2 = await createCustomer({
      ...testInput,
      company_name: 'Second Company',
      slack_channel: '#second-support'
    });

    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.company_name).toEqual('Acme Corporation');
    expect(customer2.company_name).toEqual('Second Company');

    // Verify both records exist in database
    const allCustomers = await db.select()
      .from(customersTable)
      .execute();

    expect(allCustomers).toHaveLength(2);
    const companyNames = allCustomers.map(c => c.company_name).sort();
    expect(companyNames).toEqual(['Acme Corporation', 'Second Company']);
  });

  it('should set created_at and updated_at timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createCustomer(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Verify both timestamps are set to same time on creation
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });
});