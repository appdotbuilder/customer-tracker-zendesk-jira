import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomerInput, type Customer } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchCustomers = async (input: SearchCustomerInput): Promise<Customer[]> => {
  try {
    // Perform case-insensitive search on company_name and slack_channel
    const results = await db.select()
      .from(customersTable)
      .where(
        or(
          ilike(customersTable.company_name, `%${input.query}%`),
          ilike(customersTable.slack_channel, `%${input.query}%`)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Customer search failed:', error);
    throw error;
  }
};