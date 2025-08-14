import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
  getCustomerByIdInputSchema,
  searchCustomerInputSchema,
  getDailyDifferencesInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getCustomerById } from './handlers/get_customer_by_id';
import { updateCustomer } from './handlers/update_customer';
import { searchCustomers } from './handlers/search_customers';
import { getCustomerZendeskTickets } from './handlers/get_customer_zendesk_tickets';
import { getCustomerJiraIssues } from './handlers/get_customer_jira_issues';
import { syncZendeskTickets } from './handlers/sync_zendesk_tickets';
import { syncJiraIssues } from './handlers/sync_jira_issues';
import { getDailyDifferences } from './handlers/get_daily_differences';
import { createDailySnapshots } from './handlers/create_daily_snapshots';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),

  getCustomers: publicProcedure
    .query(() => getCustomers()),

  getCustomerById: publicProcedure
    .input(getCustomerByIdInputSchema)
    .query(({ input }) => getCustomerById(input)),

  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),

  searchCustomers: publicProcedure
    .input(searchCustomerInputSchema)
    .query(({ input }) => searchCustomers(input)),

  // Ticket and issue retrieval
  getCustomerZendeskTickets: publicProcedure
    .input(getCustomerByIdInputSchema)
    .query(({ input }) => getCustomerZendeskTickets(input)),

  getCustomerJiraIssues: publicProcedure
    .input(getCustomerByIdInputSchema)
    .query(({ input }) => getCustomerJiraIssues(input)),

  // API synchronization
  syncZendeskTickets: publicProcedure
    .input(getCustomerByIdInputSchema)
    .mutation(({ input }) => syncZendeskTickets(input)),

  syncJiraIssues: publicProcedure
    .input(getCustomerByIdInputSchema)
    .mutation(({ input }) => syncJiraIssues(input)),

  // Daily differences and snapshots
  getDailyDifferences: publicProcedure
    .input(getDailyDifferencesInputSchema)
    .query(({ input }) => getDailyDifferences(input)),

  createDailySnapshots: publicProcedure
    .mutation(() => createDailySnapshots()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();