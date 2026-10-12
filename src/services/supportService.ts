import { apiRequest } from './httpClient'
import { FAQ_ITEMS, SUPPORT_TICKETS } from '@/data/support'
import { newTicketReference } from '@/data/operations'
import type { FaqItem, FeedbackPayload, SupportRequestPayload, SupportTicket } from '@/types'

export const supportService = {
  /** REST contract: GET /support/faq */
  async listFaq(): Promise<FaqItem[]> {
    return apiRequest<FaqItem[]>({
      url: '/support/faq',
      latencyMs: 340,
      mock: () => FAQ_ITEMS,
    })
  },

  /** REST contract: GET /support/tickets */
  async listTickets(): Promise<SupportTicket[]> {
    return apiRequest<SupportTicket[]>({
      url: '/support/tickets',
      latencyMs: 400,
      mock: () => SUPPORT_TICKETS,
    })
  },

  /** REST contract: POST /support/tickets */
  async createTicket(payload: SupportRequestPayload): Promise<SupportTicket> {
    return apiRequest<SupportTicket>({
      url: '/support/tickets',
      method: 'post',
      body: payload,
      latencyMs: 780,
      mock: () => ({
        id: `tkt-${Date.now()}`,
        reference: newTicketReference(),
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: 'Customer Operations',
        messageCount: 1,
      }),
    })
  },

  /** REST contract: POST /support/feedback */
  async submitFeedback(payload: FeedbackPayload): Promise<{ received: boolean }> {
    return apiRequest<{ received: boolean }>({
      url: '/support/feedback',
      method: 'post',
      body: payload,
      latencyMs: 700,
      mock: () => ({ received: true }),
    })
  },
}
