import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  slack_channel: text('slack_channel').notNull(),
  zendesk_subdomain: text('zendesk_subdomain'),
  zendesk_api_token: text('zendesk_api_token'),
  zendesk_email: text('zendesk_email'),
  jira_host: text('jira_host'),
  jira_api_token: text('jira_api_token'),
  jira_email: text('jira_email'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Zendesk tickets table
export const zendeskTicketsTable = pgTable('zendesk_tickets', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  ticket_id: integer('ticket_id').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(),
  requester: text('requester').notNull(),
  last_update: timestamp('last_update').notNull(),
  ticket_url: text('ticket_url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// JIRA issues table
export const jiraIssuesTable = pgTable('jira_issues', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  issue_key: text('issue_key').notNull(),
  summary: text('summary').notNull(),
  status: text('status').notNull(),
  assignee: text('assignee'),
  project: text('project').notNull(),
  issue_url: text('issue_url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Zendesk ticket snapshots for daily differences
export const zendeskTicketSnapshotsTable = pgTable('zendesk_ticket_snapshots', {
  id: serial('id').primaryKey(),
  ticket_id: integer('ticket_id').notNull(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(),
  requester: text('requester').notNull(),
  last_update: timestamp('last_update').notNull(),
  ticket_url: text('ticket_url').notNull(),
  snapshot_date: timestamp('snapshot_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// JIRA issue snapshots for daily differences
export const jiraIssueSnapshotsTable = pgTable('jira_issue_snapshots', {
  id: serial('id').primaryKey(),
  issue_key: text('issue_key').notNull(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  summary: text('summary').notNull(),
  status: text('status').notNull(),
  assignee: text('assignee'),
  project: text('project').notNull(),
  issue_url: text('issue_url').notNull(),
  snapshot_date: timestamp('snapshot_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  zendeskTickets: many(zendeskTicketsTable),
  jiraIssues: many(jiraIssuesTable),
  zendeskTicketSnapshots: many(zendeskTicketSnapshotsTable),
  jiraIssueSnapshots: many(jiraIssueSnapshotsTable),
}));

export const zendeskTicketsRelations = relations(zendeskTicketsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [zendeskTicketsTable.customer_id],
    references: [customersTable.id],
  }),
}));

export const jiraIssuesRelations = relations(jiraIssuesTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [jiraIssuesTable.customer_id],
    references: [customersTable.id],
  }),
}));

export const zendeskTicketSnapshotsRelations = relations(zendeskTicketSnapshotsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [zendeskTicketSnapshotsTable.customer_id],
    references: [customersTable.id],
  }),
}));

export const jiraIssueSnapshotsRelations = relations(jiraIssueSnapshotsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [jiraIssueSnapshotsTable.customer_id],
    references: [customersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;

export type ZendeskTicket = typeof zendeskTicketsTable.$inferSelect;
export type NewZendeskTicket = typeof zendeskTicketsTable.$inferInsert;

export type JiraIssue = typeof jiraIssuesTable.$inferSelect;
export type NewJiraIssue = typeof jiraIssuesTable.$inferInsert;

export type ZendeskTicketSnapshot = typeof zendeskTicketSnapshotsTable.$inferSelect;
export type NewZendeskTicketSnapshot = typeof zendeskTicketSnapshotsTable.$inferInsert;

export type JiraIssueSnapshot = typeof jiraIssueSnapshotsTable.$inferSelect;
export type NewJiraIssueSnapshot = typeof jiraIssueSnapshotsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  customers: customersTable,
  zendeskTickets: zendeskTicketsTable,
  jiraIssues: jiraIssuesTable,
  zendeskTicketSnapshots: zendeskTicketSnapshotsTable,
  jiraIssueSnapshots: jiraIssueSnapshotsTable,
};