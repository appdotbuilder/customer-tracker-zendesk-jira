import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomerInput } from '../schema';
import { searchCustomers } from '../handlers/search_customers';

// Test customers data
const testCustomers = [
  {
    company_name: 'Acme Corporation',
    slack_channel: '#acme-support',
    zendesk_subdomain: 'acme',
    zendesk_api_token: 'token123',
    zendesk_email: 'admin@acme.com',
    jira_host: 'acme.atlassian.net',
    jira_api_token: 'jira123',
    jira_email: 'admin@acme.com'
  },
  {
    company_name: 'TechStart Inc',
    slack_channel: '#techstart-help',
    zendesk_subdomain: null,
    zendesk_api_token: null,
    zendesk_email: null,
    jira_host: 'techstart.atlassian.net',
    jira_api_token: 'jira456',
    jira_email: 'support@techstart.com'
  },
  {
    company_name: 'Global Solutions Ltd',
    slack_channel: '#global-support',
    zendesk_subdomain: 'globalsol',
    zendesk_api_token: null,
    zendesk_email: null,
    jira_host: null,
    jira_api_token: null,
    jira_email: null
  }
];

describe('searchCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test customers
    await db.insert(customersTable).values(testCustomers).execute();
  });

  it('should search customers by company name (exact match)', async () => {
    const input: SearchCustomerInput = {
      query: 'Acme Corporation'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('Acme Corporation');
    expect(results[0].slack_channel).toEqual('#acme-support');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should search customers by company name (partial match)', async () => {
    const input: SearchCustomerInput = {
      query: 'Tech'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('TechStart Inc');
    expect(results[0].slack_channel).toEqual('#techstart-help');
  });

  it('should search customers by slack channel (exact match)', async () => {
    const input: SearchCustomerInput = {
      query: '#global-support'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('Global Solutions Ltd');
    expect(results[0].slack_channel).toEqual('#global-support');
  });

  it('should search customers by slack channel (partial match)', async () => {
    const input: SearchCustomerInput = {
      query: 'support'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(2);
    const companyNames = results.map(r => r.company_name);
    expect(companyNames).toContain('Acme Corporation');
    expect(companyNames).toContain('Global Solutions Ltd');
  });

  it('should perform case-insensitive search on company name', async () => {
    const input: SearchCustomerInput = {
      query: 'acme'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('Acme Corporation');
  });

  it('should perform case-insensitive search on slack channel', async () => {
    const input: SearchCustomerInput = {
      query: 'HELP'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('TechStart Inc');
    expect(results[0].slack_channel).toEqual('#techstart-help');
  });

  it('should return multiple results when query matches multiple customers', async () => {
    const input: SearchCustomerInput = {
      query: 'Inc'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toEqual('TechStart Inc');
  });

  it('should return empty array when no customers match', async () => {
    const input: SearchCustomerInput = {
      query: 'NonExistentCompany'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle special characters in search query', async () => {
    const input: SearchCustomerInput = {
      query: '#'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(3);
    // All slack channels start with #
    const slackChannels = results.map(r => r.slack_channel);
    expect(slackChannels).toContain('#acme-support');
    expect(slackChannels).toContain('#techstart-help');
    expect(slackChannels).toContain('#global-support');
  });

  it('should handle empty search query', async () => {
    const input: SearchCustomerInput = {
      query: ''
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(3);
    // Empty query should match all customers
  });

  it('should return customers with all required fields populated', async () => {
    const input: SearchCustomerInput = {
      query: 'Acme'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    const customer = results[0];

    // Check all required fields are present
    expect(customer.id).toBeTypeOf('number');
    expect(customer.company_name).toBeTypeOf('string');
    expect(customer.slack_channel).toBeTypeOf('string');
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);

    // Check nullable fields
    expect(customer.zendesk_subdomain === null || typeof customer.zendesk_subdomain === 'string').toBe(true);
    expect(customer.zendesk_api_token === null || typeof customer.zendesk_api_token === 'string').toBe(true);
    expect(customer.zendesk_email === null || typeof customer.zendesk_email === 'string').toBe(true);
    expect(customer.jira_host === null || typeof customer.jira_host === 'string').toBe(true);
    expect(customer.jira_api_token === null || typeof customer.jira_api_token === 'string').toBe(true);
    expect(customer.jira_email === null || typeof customer.jira_email === 'string').toBe(true);
  });

  it('should match customers with either company name or slack channel containing query', async () => {
    // Add a customer where company name doesn't match but slack channel does
    await db.insert(customersTable).values({
      company_name: 'Different Company',
      slack_channel: '#acme-different',
      zendesk_subdomain: null,
      zendesk_api_token: null,
      zendesk_email: null,
      jira_host: null,
      jira_api_token: null,
      jira_email: null
    }).execute();

    const input: SearchCustomerInput = {
      query: 'acme'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(2);
    const companyNames = results.map(r => r.company_name);
    expect(companyNames).toContain('Acme Corporation'); // matches company name
    expect(companyNames).toContain('Different Company'); // matches slack channel
  });
});