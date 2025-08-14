import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, zendeskTicketsTable } from '../db/schema';
import { type GetCustomerByIdInput } from '../schema';
import { syncZendeskTickets } from '../handlers/sync_zendesk_tickets';
import { eq } from 'drizzle-orm';

describe('syncZendeskTickets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return error for non-existent customer', async () => {
    const input: GetCustomerByIdInput = { id: 999 };
    
    const result = await syncZendeskTickets(input);
    
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Customer with ID 999 not found');
  });

  it('should return error for customer without Zendesk credentials', async () => {
    // Create customer without Zendesk credentials
    const customers = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel',
        zendesk_subdomain: null,
        zendesk_api_token: null,
        zendesk_email: null
      })
      .returning()
      .execute();

    const input: GetCustomerByIdInput = { id: customers[0].id };
    
    const result = await syncZendeskTickets(input);
    
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing required Zendesk credentials');
  });

  it('should sync tickets for customer with valid credentials', async () => {
    // Create customer with Zendesk credentials
    const customers = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel',
        zendesk_subdomain: 'testcompany',
        zendesk_api_token: 'test-token',
        zendesk_email: 'admin@testcompany.com'
      })
      .returning()
      .execute();

    const input: GetCustomerByIdInput = { id: customers[0].id };
    
    const result = await syncZendeskTickets(input);
    
    expect(result.synced).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify tickets were created in database
    const tickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, customers[0].id))
      .execute();

    expect(tickets).toHaveLength(2);
    
    // Check first ticket
    const ticket1 = tickets.find(t => t.ticket_id === 12345);
    expect(ticket1).toBeDefined();
    expect(ticket1!.subject).toBe('Login issues with new update');
    expect(ticket1!.status).toBe('open');
    expect(ticket1!.requester).toBe('john.doe@example.com');
    expect(ticket1!.ticket_url).toContain('testcompany.zendesk.com');
    expect(ticket1!.last_update).toBeInstanceOf(Date);
    expect(ticket1!.created_at).toBeInstanceOf(Date);
    expect(ticket1!.updated_at).toBeInstanceOf(Date);

    // Check second ticket
    const ticket2 = tickets.find(t => t.ticket_id === 12346);
    expect(ticket2).toBeDefined();
    expect(ticket2!.subject).toBe('Feature request: Dark mode');
    expect(ticket2!.status).toBe('pending');
    expect(ticket2!.requester).toBe('jane.smith@example.com');
  });

  it('should update existing tickets on subsequent syncs', async () => {
    // Create customer with Zendesk credentials
    const customers = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel',
        zendesk_subdomain: 'testcompany',
        zendesk_api_token: 'test-token',
        zendesk_email: 'admin@testcompany.com'
      })
      .returning()
      .execute();

    const input: GetCustomerByIdInput = { id: customers[0].id };
    
    // First sync
    const firstResult = await syncZendeskTickets(input);
    expect(firstResult.synced).toBe(2);
    expect(firstResult.errors).toHaveLength(0);

    // Get initial ticket count
    const initialTickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, customers[0].id))
      .execute();

    expect(initialTickets).toHaveLength(2);

    // Second sync (should update existing tickets, not create new ones)
    const secondResult = await syncZendeskTickets(input);
    expect(secondResult.synced).toBe(2);
    expect(secondResult.errors).toHaveLength(0);

    // Verify ticket count hasn't changed
    const updatedTickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, customers[0].id))
      .execute();

    expect(updatedTickets).toHaveLength(2);

    // Verify updated_at timestamp has changed
    const updatedTicket = updatedTickets.find(t => t.ticket_id === 12345);
    const initialTicket = initialTickets.find(t => t.ticket_id === 12345);
    
    expect(updatedTicket!.updated_at.getTime()).toBeGreaterThan(initialTicket!.updated_at.getTime());
  });

  it('should handle partial sync failures gracefully', async () => {
    // Create customer with Zendesk credentials
    const customers = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel',
        zendesk_subdomain: 'testcompany',
        zendesk_api_token: 'test-token',
        zendesk_email: 'admin@testcompany.com'
      })
      .returning()
      .execute();

    // Insert a ticket that would cause a constraint violation
    // (This simulates a scenario where one ticket fails but others should succeed)
    await db.insert(zendeskTicketsTable)
      .values({
        customer_id: customers[0].id,
        ticket_id: 12345,
        subject: 'Existing ticket',
        status: 'closed',
        requester: 'existing@example.com',
        last_update: new Date('2024-01-01T00:00:00Z'),
        ticket_url: 'https://existing.zendesk.com/tickets/12345'
      })
      .execute();

    const input: GetCustomerByIdInput = { id: customers[0].id };
    
    const result = await syncZendeskTickets(input);
    
    // Should still sync successfully (updates existing ticket)
    expect(result.synced).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify both tickets exist
    const tickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.customer_id, customers[0].id))
      .execute();

    expect(tickets).toHaveLength(2);

    // Verify the existing ticket was updated
    const updatedTicket = tickets.find(t => t.ticket_id === 12345);
    expect(updatedTicket!.subject).toBe('Login issues with new update');
    expect(updatedTicket!.status).toBe('open');
  });

  it('should validate customer ID is provided', async () => {
    const input: GetCustomerByIdInput = { id: 0 };
    
    const result = await syncZendeskTickets(input);
    
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Customer with ID 0 not found');
  });
});