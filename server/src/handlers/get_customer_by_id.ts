import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomerByIdInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCustomerById(input: GetCustomerByIdInput): Promise<Customer | null> {
  try {
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const customer = result[0];
    return customer;
  } catch (error) {
    console.error('Customer retrieval failed:', error);
    throw error;
  }
}