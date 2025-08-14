import { db } from '../db';
import { jiraIssuesTable, customersTable } from '../db/schema';
import { type GetCustomerByIdInput, type JiraIssue } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomerJiraIssues = async (input: GetCustomerByIdInput): Promise<JiraIssue[]> => {
  try {
    // First verify the customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // Fetch all JIRA issues for the customer
    const results = await db.select()
      .from(jiraIssuesTable)
      .where(eq(jiraIssuesTable.customer_id, input.id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch customer JIRA issues:', error);
    throw error;
  }
};