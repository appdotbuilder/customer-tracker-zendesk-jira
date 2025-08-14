import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { desc } from 'drizzle-orm';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // Fetch all customers, ordered by creation date (newest first)
    const results = await db.select()
      .from(customersTable)
      .orderBy(desc(customersTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
};