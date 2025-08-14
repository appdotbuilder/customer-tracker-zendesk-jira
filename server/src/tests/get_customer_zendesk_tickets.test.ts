import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, zendeskTicketsTable } from '../db/schema';
import { type GetCustomerByIdInput } from '../schema';
import { getCustomerZendeskTickets } from '../handlers/get_customer_zendesk_tickets';
import { eq } from 'drizzle-orm';

describe('getCustomerZendeskTickets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch Zendesk tickets for a customer', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel',
        zendesk_subdomain: 'test-subdomain',
        zendesk_api_token: 'test-token',
        zendesk_email: 'test@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test Zendesk tickets
    const testTickets = [
      {
        customer_id: customerId,
        ticket_id: 12345,
        subject: 'First ticket',
        status: 'open',
        requester: 'user1@example.com',
        last_update: new Date('2024-01-01T10:00:00Z'),
        ticket_url: 'https://test-subdomain.zendesk.com/tickets/12345'
      },
      {
        customer_id: customerId,
        ticket_id: 12346,
        subject: 'Second ticket',
        status: 'pending',
        requester: 'user2@example.com',
        last_update: new Date('2024-01-02T11:00:00Z'),
        ticket_url: 'https://test-subdomain.zendesk.com/tickets/12346'
      },
      {
        customer_id: customerId,
        ticket_id: 12347,
        subject: 'Third ticket',
        status: 'solved',
        requester: 'user3@example.com',
        last_update: new Date('2024-01-03T12:00:00Z'),
        ticket_url: 'https://test-subdomain.zendesk.com/tickets/12347'
      }
    ];

    await db.insert(zendeskTicketsTable)
      .values(testTickets)
      .execute();

    // Test the handler
    const input: GetCustomerByIdInput = { id: customerId };
    const result = await getCustomerZendeskTickets(input);

    // Verify results
    expect(result).toHaveLength(3);
    
    // Sort by ticket_id for consistent testing
    result.sort((a, b) => a.ticket_id - b.ticket_id);

    // Verify first ticket
    expect(result[0].ticket_id).toEqual(12345);
    expect(result[0].subject).toEqual('First ticket');
    expect(result[0].status).toEqual('open');
    expect(result[0].requester).toEqual('user1@example.com');
    expect(result[0].last_update).toBeInstanceOf(Date);
    expect(result[0].ticket_url).toEqual('https://test-subdomain.zendesk.com/tickets/12345');
    expect(result[0].customer_id).toEqual(customerId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second ticket
    expect(result[1].ticket_id).toEqual(12346);
    expect(result[1].subject).toEqual('Second ticket');
    expect(result[1].status).toEqual('pending');

    // Verify third ticket
    expect(result[2].ticket_id).toEqual(12347);
    expect(result[2].subject).toEqual('Third ticket');
    expect(result[2].status).toEqual('solved');
  });

  it('should return empty array when customer has no tickets', async () => {
    // Create test customer without tickets
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const input: GetCustomerByIdInput = { id: customerId };
    const result = await getCustomerZendeskTickets(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return tickets for the specified customer', async () => {
    // Create two test customers
    const customer1Result = await db.insert(customersTable)
      .values({
        company_name: 'Company 1',
        slack_channel: '#company1'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        company_name: 'Company 2',
        slack_channel: '#company2'
      })
      .returning()
      .execute();

    const customer1Id = customer1Result[0].id;
    const customer2Id = customer2Result[0].id;

    // Create tickets for both customers
    await db.insert(zendeskTicketsTable)
      .values([
        {
          customer_id: customer1Id,
          ticket_id: 11111,
          subject: 'Customer 1 ticket',
          status: 'open',
          requester: 'user1@example.com',
          last_update: new Date('2024-01-01T10:00:00Z'),
          ticket_url: 'https://company1.zendesk.com/tickets/11111'
        },
        {
          customer_id: customer2Id,
          ticket_id: 22222,
          subject: 'Customer 2 ticket',
          status: 'pending',
          requester: 'user2@example.com',
          last_update: new Date('2024-01-01T11:00:00Z'),
          ticket_url: 'https://company2.zendesk.com/tickets/22222'
        }
      ])
      .execute();

    // Test fetching tickets for customer 1
    const input1: GetCustomerByIdInput = { id: customer1Id };
    const result1 = await getCustomerZendeskTickets(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].ticket_id).toEqual(11111);
    expect(result1[0].subject).toEqual('Customer 1 ticket');
    expect(result1[0].customer_id).toEqual(customer1Id);

    // Test fetching tickets for customer 2
    const input2: GetCustomerByIdInput = { id: customer2Id };
    const result2 = await getCustomerZendeskTickets(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].ticket_id).toEqual(22222);
    expect(result2[0].subject).toEqual('Customer 2 ticket');
    expect(result2[0].customer_id).toEqual(customer2Id);
  });

  it('should throw error when customer does not exist', async () => {
    const nonExistentId = 999999;
    const input: GetCustomerByIdInput = { id: nonExistentId };

    await expect(getCustomerZendeskTickets(input))
      .rejects
      .toThrow(/Customer with id 999999 not found/i);
  });

  it('should verify tickets are saved to database correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Test Company',
        slack_channel: '#test-channel'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test ticket
    await db.insert(zendeskTicketsTable)
      .values({
        customer_id: customerId,
        ticket_id: 99999,
        subject: 'Database verification ticket',
        status: 'new',
        requester: 'db-test@example.com',
        last_update: new Date('2024-01-01T09:00:00Z'),
        ticket_url: 'https://test.zendesk.com/tickets/99999'
      })
      .execute();

    // Fetch via handler
    const result = await getCustomerZendeskTickets({ id: customerId });

    // Verify ticket in database directly
    const dbTickets = await db.select()
      .from(zendeskTicketsTable)
      .where(eq(zendeskTicketsTable.ticket_id, 99999))
      .execute();

    expect(dbTickets).toHaveLength(1);
    expect(dbTickets[0].subject).toEqual('Database verification ticket');
    expect(dbTickets[0].status).toEqual('new');
    expect(dbTickets[0].requester).toEqual('db-test@example.com');

    // Verify handler result matches database
    expect(result).toHaveLength(1);
    expect(result[0].ticket_id).toEqual(dbTickets[0].ticket_id);
    expect(result[0].subject).toEqual(dbTickets[0].subject);
    expect(result[0].status).toEqual(dbTickets[0].status);
  });

  it('should handle tickets with different statuses', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        company_name: 'Status Test Company',
        slack_channel: '#status-test'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create tickets with various statuses
    const ticketStatuses = ['new', 'open', 'pending', 'on-hold', 'solved', 'closed'];
    const testTickets = ticketStatuses.map((status, index) => ({
      customer_id: customerId,
      ticket_id: 20000 + index,
      subject: `${status} ticket`,
      status,
      requester: `${status}@example.com`,
      last_update: new Date('2024-01-01T10:00:00Z'),
      ticket_url: `https://test.zendesk.com/tickets/${20000 + index}`
    }));

    await db.insert(zendeskTicketsTable)
      .values(testTickets)
      .execute();

    const result = await getCustomerZendeskTickets({ id: customerId });

    expect(result).toHaveLength(6);

    // Verify all statuses are present
    const resultStatuses = result.map(ticket => ticket.status).sort();
    expect(resultStatuses).toEqual(['closed', 'new', 'on-hold', 'open', 'pending', 'solved']);
  });
});