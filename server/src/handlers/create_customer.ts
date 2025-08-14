import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        company_name: input.company_name,
        slack_channel: input.slack_channel,
        zendesk_subdomain: input.zendesk_subdomain,
        zendesk_api_token: input.zendesk_api_token,
        zendesk_email: input.zendesk_email,
        jira_host: input.jira_host,
        jira_api_token: input.jira_api_token,
        jira_email: input.jira_email
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};