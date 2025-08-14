import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  slack_channel: z.string(),
  zendesk_subdomain: z.string().nullable(),
  zendesk_api_token: z.string().nullable(),
  zendesk_email: z.string().nullable(),
  jira_host: z.string().nullable(),
  jira_api_token: z.string().nullable(),
  jira_email: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Input schema for creating customers
export const createCustomerInputSchema = z.object({
  company_name: z.string().min(1),
  slack_channel: z.string().min(1),
  zendesk_subdomain: z.string().nullable(),
  zendesk_api_token: z.string().nullable(),
  zendesk_email: z.string().email().nullable(),
  jira_host: z.string().nullable(),
  jira_api_token: z.string().nullable(),
  jira_email: z.string().email().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  company_name: z.string().min(1).optional(),
  slack_channel: z.string().min(1).optional(),
  zendesk_subdomain: z.string().nullable().optional(),
  zendesk_api_token: z.string().nullable().optional(),
  zendesk_email: z.string().email().nullable().optional(),
  jira_host: z.string().nullable().optional(),
  jira_api_token: z.string().nullable().optional(),
  jira_email: z.string().email().nullable().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Search input schema
export const searchCustomerInputSchema = z.object({
  query: z.string().min(1)
});

export type SearchCustomerInput = z.infer<typeof searchCustomerInputSchema>;

// Zendesk ticket schema
export const zendeskTicketSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  ticket_id: z.number(),
  subject: z.string(),
  status: z.string(),
  requester: z.string(),
  last_update: z.coerce.date(),
  ticket_url: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ZendeskTicket = z.infer<typeof zendeskTicketSchema>;

// JIRA issue schema
export const jiraIssueSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  issue_key: z.string(),
  summary: z.string(),
  status: z.string(),
  assignee: z.string().nullable(),
  project: z.string(),
  issue_url: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JiraIssue = z.infer<typeof jiraIssueSchema>;

// Historical snapshot schemas for daily differences
export const zendeskTicketSnapshotSchema = z.object({
  id: z.number(),
  ticket_id: z.number(),
  customer_id: z.number(),
  subject: z.string(),
  status: z.string(),
  requester: z.string(),
  last_update: z.coerce.date(),
  ticket_url: z.string(),
  snapshot_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ZendeskTicketSnapshot = z.infer<typeof zendeskTicketSnapshotSchema>;

export const jiraIssueSnapshotSchema = z.object({
  id: z.number(),
  issue_key: z.string(),
  customer_id: z.number(),
  summary: z.string(),
  status: z.string(),
  assignee: z.string().nullable(),
  project: z.string(),
  issue_url: z.string(),
  snapshot_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type JiraIssueSnapshot = z.infer<typeof jiraIssueSnapshotSchema>;

// Daily difference schemas
export const zendeskTicketDifferenceSchema = z.object({
  ticket_id: z.number(),
  subject: z.string(),
  current_status: z.string(),
  previous_status: z.string().nullable(),
  requester: z.string(),
  last_update: z.coerce.date(),
  ticket_url: z.string(),
  change_type: z.enum(['new', 'updated', 'status_changed'])
});

export type ZendeskTicketDifference = z.infer<typeof zendeskTicketDifferenceSchema>;

export const jiraIssueDifferenceSchema = z.object({
  issue_key: z.string(),
  summary: z.string(),
  current_status: z.string(),
  previous_status: z.string().nullable(),
  assignee: z.string().nullable(),
  project: z.string(),
  issue_url: z.string(),
  change_type: z.enum(['new', 'updated', 'status_changed', 'assignee_changed'])
});

export type JiraIssueDifference = z.infer<typeof jiraIssueDifferenceSchema>;

// Get customer by ID input schema
export const getCustomerByIdInputSchema = z.object({
  id: z.number()
});

export type GetCustomerByIdInput = z.infer<typeof getCustomerByIdInputSchema>;

// Daily differences input schema
export const getDailyDifferencesInputSchema = z.object({
  customer_id: z.number(),
  date: z.string().optional() // ISO date string, defaults to today if not provided
});

export type GetDailyDifferencesInput = z.infer<typeof getDailyDifferencesInputSchema>;

// Combined daily differences response
export const dailyDifferencesSchema = z.object({
  customer_id: z.number(),
  date: z.string(),
  zendesk_differences: z.array(zendeskTicketDifferenceSchema),
  jira_differences: z.array(jiraIssueDifferenceSchema)
});

export type DailyDifferences = z.infer<typeof dailyDifferencesSchema>;