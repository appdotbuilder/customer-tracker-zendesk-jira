import { db } from '../db';
import { customersTable, zendeskTicketsTable } from '../db/schema';
import { type GetCustomerByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function syncZendeskTickets(input: GetCustomerByIdInput): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // Get customer with Zendesk credentials
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (customers.length === 0) {
      errors.push(`Customer with ID ${input.id} not found`);
      return { synced: 0, errors };
    }

    const customer = customers[0];

    // Check if customer has Zendesk credentials
    if (!customer.zendesk_subdomain || !customer.zendesk_api_token || !customer.zendesk_email) {
      errors.push(`Customer ${customer.company_name} is missing required Zendesk credentials`);
      return { synced: 0, errors };
    }

    // Mock Zendesk API response - in real implementation this would be actual API calls
    const mockTickets = [
      {
        id: 12345,
        subject: 'Login issues with new update',
        status: 'open',
        requester: { name: 'john.doe@example.com' },
        updated_at: '2024-01-15T10:30:00Z',
        url: `https://${customer.zendesk_subdomain}.zendesk.com/api/v2/tickets/12345.json`
      },
      {
        id: 12346,
        subject: 'Feature request: Dark mode',
        status: 'pending',
        requester: { name: 'jane.smith@example.com' },
        updated_at: '2024-01-15T11:45:00Z',
        url: `https://${customer.zendesk_subdomain}.zendesk.com/api/v2/tickets/12346.json`
      }
    ];

    // Process each ticket
    for (const ticket of mockTickets) {
      try {
        // Check if ticket already exists
        const existingTickets = await db.select()
          .from(zendeskTicketsTable)
          .where(eq(zendeskTicketsTable.ticket_id, ticket.id))
          .execute();

        const ticketData = {
          customer_id: input.id,
          ticket_id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          requester: ticket.requester.name,
          last_update: new Date(ticket.updated_at),
          ticket_url: ticket.url,
          updated_at: new Date()
        };

        if (existingTickets.length === 0) {
          // Insert new ticket
          await db.insert(zendeskTicketsTable)
            .values(ticketData)
            .execute();
        } else {
          // Update existing ticket
          await db.update(zendeskTicketsTable)
            .set(ticketData)
            .where(eq(zendeskTicketsTable.ticket_id, ticket.id))
            .execute();
        }

        syncedCount++;
      } catch (ticketError) {
        console.error(`Error processing ticket ${ticket.id}:`, ticketError);
        errors.push(`Failed to sync ticket ${ticket.id}: ${ticketError instanceof Error ? ticketError.message : 'Unknown error'}`);
      }
    }

    return { synced: syncedCount, errors };

  } catch (error) {
    console.error('Zendesk sync failed:', error);
    errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { synced: syncedCount, errors };
  }
}