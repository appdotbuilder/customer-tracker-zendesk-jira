import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer> => {
  try {
    // First, check if the customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .limit(1)
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof customersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }
    if (input.slack_channel !== undefined) {
      updateData.slack_channel = input.slack_channel;
    }
    if (input.zendesk_subdomain !== undefined) {
      updateData.zendesk_subdomain = input.zendesk_subdomain;
    }
    if (input.zendesk_api_token !== undefined) {
      updateData.zendesk_api_token = input.zendesk_api_token;
    }
    if (input.zendesk_email !== undefined) {
      updateData.zendesk_email = input.zendesk_email;
    }
    if (input.jira_host !== undefined) {
      updateData.jira_host = input.jira_host;
    }
    if (input.jira_api_token !== undefined) {
      updateData.jira_api_token = input.jira_api_token;
    }
    if (input.jira_email !== undefined) {
      updateData.jira_email = input.jira_email;
    }

    // Update the customer
    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};