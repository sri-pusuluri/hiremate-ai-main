export type TicketCategory = 
  | 'bug' 
  | 'billing' 
  | 'feature_request' 
  | 'integration' 
  | 'general';

export type TicketPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type TicketStatus = 
  | 'open' 
  | 'in_progress' 
  | 'waiting_on_client' 
  | 'resolved' 
  | 'closed';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderEmail: string;
  senderRole: 'super_admin' | 'client_admin' | 'recruiter' | 'support_agent';
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  attachments: string[];
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  contentMarkdown: string;
  helpfulCount: number;
  tags: string[];
}
