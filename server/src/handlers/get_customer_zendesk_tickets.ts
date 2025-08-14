import { db } from '../db';
import { zendeskTicketsTable, customersTable } from '../db/schema';
import { type GetCustomerByIdInput, type ZendeskTicket } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCustomerZendeskTickets(input: GetCustomerByIdInput): Promise<ZendeskTicket[]> {
  try {
    // First verify the customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .limit(1)
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // Fetch all Zendesk tickets for the customer
    const tickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, input.id))
      .execute();

    return tickets;
  } catch (error) {
    console.error('Failed to fetch Zendesk tickets:', error);
    throw error;
  }
}