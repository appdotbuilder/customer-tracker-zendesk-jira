import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type CreateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test data for creating a customer to update
const testCustomer: CreateCustomerInput = {
  company_name: 'Test Company',
  slack_channel: '#test-channel',
  zendesk_subdomain: 'test-zendesk',
  zendesk_api_token: 'test-zendesk-token',
  zendesk_email: 'zendesk@test.com',
  jira_host: 'test.atlassian.net',
  jira_api_token: 'test-jira-token',
  jira_email: 'jira@test.com'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all customer fields', async () => {
    // Create a customer first
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      company_name: 'Updated Company',
      slack_channel: '#updated-channel',
      zendesk_subdomain: 'updated-zendesk',
      zendesk_api_token: 'updated-zendesk-token',
      zendesk_email: 'updated-zendesk@test.com',
      jira_host: 'updated.atlassian.net',
      jira_api_token: 'updated-jira-token',
      jira_email: 'updated-jira@test.com'
    };

    const result = await updateCustomer(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.company_name).toEqual('Updated Company');
    expect(result.slack_channel).toEqual('#updated-channel');
    expect(result.zendesk_subdomain).toEqual('updated-zendesk');
    expect(result.zendesk_api_token).toEqual('updated-zendesk-token');
    expect(result.zendesk_email).toEqual('updated-zendesk@test.com');
    expect(result.jira_host).toEqual('updated.atlassian.net');
    expect(result.jira_api_token).toEqual('updated-jira-token');
    expect(result.jira_email).toEqual('updated-jira@test.com');
    expect(result.created_at).toEqual(createdCustomer.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdCustomer.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create a customer first
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const partialUpdate: UpdateCustomerInput = {
      id: createdCustomer.id,
      company_name: 'Partially Updated Company',
      slack_channel: '#partially-updated-channel'
    };

    const result = await updateCustomer(partialUpdate);

    // Verify only provided fields were updated
    expect(result.company_name).toEqual('Partially Updated Company');
    expect(result.slack_channel).toEqual('#partially-updated-channel');
    
    // Verify other fields remain unchanged
    expect(result.zendesk_subdomain).toEqual(createdCustomer.zendesk_subdomain);
    expect(result.zendesk_api_token).toEqual(createdCustomer.zendesk_api_token);
    expect(result.zendesk_email).toEqual(createdCustomer.zendesk_email);
    expect(result.jira_host).toEqual(createdCustomer.jira_host);
    expect(result.jira_api_token).toEqual(createdCustomer.jira_api_token);
    expect(result.jira_email).toEqual(createdCustomer.jira_email);
    expect(result.updated_at > createdCustomer.updated_at).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    // Create a customer first
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const nullableUpdate: UpdateCustomerInput = {
      id: createdCustomer.id,
      zendesk_subdomain: null,
      zendesk_api_token: null,
      zendesk_email: null,
      jira_host: null,
      jira_api_token: null,
      jira_email: null
    };

    const result = await updateCustomer(nullableUpdate);

    // Verify nullable fields were set to null
    expect(result.zendesk_subdomain).toBeNull();
    expect(result.zendesk_api_token).toBeNull();
    expect(result.zendesk_email).toBeNull();
    expect(result.jira_host).toBeNull();
    expect(result.jira_api_token).toBeNull();
    expect(result.jira_email).toBeNull();

    // Verify required fields remain unchanged
    expect(result.company_name).toEqual(createdCustomer.company_name);
    expect(result.slack_channel).toEqual(createdCustomer.slack_channel);
  });

  it('should save updated customer to database', async () => {
    // Create a customer first
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      company_name: 'Database Update Test'
    };

    await updateCustomer(updateInput);

    // Verify the update was persisted to database
    const updatedInDB = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(updatedInDB).toHaveLength(1);
    expect(updatedInDB[0].company_name).toEqual('Database Update Test');
    expect(updatedInDB[0].updated_at > createdCustomer.updated_at).toBe(true);
  });

  it('should throw error for non-existent customer', async () => {
    const nonExistentUpdate: UpdateCustomerInput = {
      id: 99999,
      company_name: 'Non-existent Company'
    };

    await expect(updateCustomer(nonExistentUpdate)).rejects.toThrow(/Customer with ID 99999 not found/i);
  });

  it('should update only the updated_at timestamp when no other fields provided', async () => {
    // Create a customer first
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const minimalUpdate: UpdateCustomerInput = {
      id: createdCustomer.id
    };

    const result = await updateCustomer(minimalUpdate);

    // Verify all fields remain the same except updated_at
    expect(result.company_name).toEqual(createdCustomer.company_name);
    expect(result.slack_channel).toEqual(createdCustomer.slack_channel);
    expect(result.zendesk_subdomain).toEqual(createdCustomer.zendesk_subdomain);
    expect(result.zendesk_api_token).toEqual(createdCustomer.zendesk_api_token);
    expect(result.zendesk_email).toEqual(createdCustomer.zendesk_email);
    expect(result.jira_host).toEqual(createdCustomer.jira_host);
    expect(result.jira_api_token).toEqual(createdCustomer.jira_api_token);
    expect(result.jira_email).toEqual(createdCustomer.jira_email);
    expect(result.created_at).toEqual(createdCustomer.created_at);
    expect(result.updated_at > createdCustomer.updated_at).toBe(true);
  });

  it('should handle mixed updates of required and nullable fields', async () => {
    // Create a customer with some null values
    const customerWithNulls: CreateCustomerInput = {
      company_name: 'Mixed Update Test',
      slack_channel: '#mixed-test',
      zendesk_subdomain: null,
      zendesk_api_token: null,
      zendesk_email: null,
      jira_host: 'original.atlassian.net',
      jira_api_token: 'original-token',
      jira_email: 'original@test.com'
    };

    const [createdCustomer] = await db.insert(customersTable)
      .values(customerWithNulls)
      .returning()
      .execute();

    const mixedUpdate: UpdateCustomerInput = {
      id: createdCustomer.id,
      company_name: 'Updated Mixed Company',
      zendesk_subdomain: 'new-zendesk',
      zendesk_email: 'new-zendesk@test.com',
      jira_host: null // Clear existing value
    };

    const result = await updateCustomer(mixedUpdate);

    // Verify mixed updates
    expect(result.company_name).toEqual('Updated Mixed Company');
    expect(result.zendesk_subdomain).toEqual('new-zendesk');
    expect(result.zendesk_email).toEqual('new-zendesk@test.com');
    expect(result.jira_host).toBeNull();
    
    // Verify unchanged fields
    expect(result.slack_channel).toEqual(createdCustomer.slack_channel);
    expect(result.zendesk_api_token).toBeNull(); // Was already null
    expect(result.jira_api_token).toEqual(createdCustomer.jira_api_token);
    expect(result.jira_email).toEqual(createdCustomer.jira_email);
  });
});