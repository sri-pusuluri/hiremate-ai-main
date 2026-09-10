import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, TicketMessage, KnowledgeArticle, TicketCategory, TicketPriority, TicketStatus } from '@/types/support';

const LOCAL_STORAGE_TICKETS_KEY = 'hiresort_support_tickets_data';

// Pre-built Knowledge Base Articles for instant self-help
export const KNOWLEDGE_BASE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'How to Embed the Careers Widget on Client Websites',
    slug: 'embed-careers-widget',
    category: 'Embed & Integration',
    summary: 'Step-by-step guide to embedding responsive job listings on WordPress, React, Webflow, or plain HTML.',
    contentMarkdown: `### Embedding Your Careers Page

HireSort provides turnkey multi-platform embed options located in \`plugins/\` and \`public/widget.js\`:

1. **Universal 1-Line JavaScript Widget:**
\`\`\`html
<div id="hiresort-careers" data-client="zool" data-theme="dark"></div>
<script src="https://app.hiresort.ai/widget.js" async></script>
\`\`\`
The widget automatically calculates its internal height and dynamically communicates with the parent window using \`window.postMessage\` to prevent any scrollbars.

2. **WordPress Plugin:**
Download \`plugins/wordpress/hiresort-careers.zip\`, upload it to your WordPress admin under Plugins, and paste the \`[hiresort_jobs]\` shortcode onto any page or Elementor canvas.

3. **React Wrapper Component:**
Import \`HireSortJobs\` from \`plugins/react/HireSortJobs.tsx\` directly into your Next.js or Vite codebase.`,
    helpfulCount: 42,
    tags: ['widget', 'iframe', 'wordpress', 'react', 'embed']
  },
  {
    id: 'kb-2',
    title: 'Configuring BYOK (OpenAI, Gemini, Anthropic) AI Inference Strategy',
    slug: 'byok-ai-configuration',
    category: 'AI Strategy',
    summary: 'Learn how to connect your enterprise AI API keys to prevent rate limits and optimize candidate scoring.',
    contentMarkdown: `### Configuring BYOK (Bring Your Own Key)

Each tenant can either use HireSort's pooled AI inference or plug in their private enterprise API keys:

1. Navigate to **Tenant Settings** -> **AI Strategy** tab (\`/settings/tenant?tab=ai\`).
2. Select your AI Provider: **OpenAI**, **Anthropic Claude**, or **Google Gemini**.
3. Enter your secret API Key and select your target model (e.g., \`gpt-4o\`, \`claude-3-5-sonnet\`, \`gemini-1.5-pro\`).
4. Click **Test & Save Configuration**. Keys are encrypted and scoped strictly to your workspace.`,
    helpfulCount: 28,
    tags: ['ai', 'openai', 'gemini', 'anthropic', 'api-key']
  },
  {
    id: 'kb-3',
    title: 'Creating Per-Job Custom Screening Questions',
    slug: 'custom-screening-questions',
    category: 'Jobs & ATS',
    summary: 'Add custom text, multiple choice, or portfolio URL questions to your candidate application forms.',
    contentMarkdown: `### Custom Screening Questions

When creating or editing a job in **Jobs & ATS**:
1. Open the **Create / Edit Job** modal.
2. Scroll to the **Pre-Screening Questions** section.
3. Click **Add Question from Question Bank** or click **+ Add Custom Question**.
4. Configure field type (\`Text\`, \`Multiple Choice\`, \`Yes/No\`, \`File Upload\`) and mark whether it is mandatory.
5. All candidate answers are saved directly into the candidate profile and evaluated during AI screening.`,
    helpfulCount: 35,
    tags: ['screening', 'questions', 'job-form', 'ats']
  },
  {
    id: 'kb-4',
    title: 'Inviting Recruiters and Managing Role Permissions',
    slug: 'team-management-permissions',
    category: 'User Management',
    summary: 'Understand the difference between Super Admin, Client Admin, and Recruiter roles.',
    contentMarkdown: `### Role Hierarchy in HireSort

* **Super Admin (Platform HQ):** Global platform access, cross-tenant switcher, system uptime, and tenant creation.
* **Client Admin:** Full control over their company's branding, jobs, team members, and API keys.
* **Recruiter:** Can view candidates, conduct AI screening, shortlist applicants, and submit interview scorecards.

To invite team members, visit **Team & Users** (\`/users\`) and click **Invite Member**.`,
    helpfulCount: 19,
    tags: ['users', 'roles', 'permissions', 'invite']
  }
];

export const SEED_DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-101',
    clientId: '00000000-0000-0000-0000-000000000001',
    clientName: 'Zool',
    userId: 'usr-1',
    userEmail: 'hr@zool.in',
    subject: 'Request assistance with custom domain setup on careers portal',
    category: 'integration',
    priority: 'high',
    status: 'in_progress',
    description: 'We would like to map careers.zool.in directly to our HireSort public careers board. Please advise on the required CNAME DNS records.',
    attachments: [],
    messages: [
      {
        id: 'msg-1',
        ticketId: 'tkt-101',
        senderId: 'usr-1',
        senderEmail: 'hr@zool.in',
        senderRole: 'client_admin',
        message: 'We would like to map careers.zool.in directly to our HireSort public careers board. Please advise on the required CNAME DNS records.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: 'msg-2',
        ticketId: 'tkt-101',
        senderId: 'admin-platform',
        senderEmail: 'support@hiresort.ai',
        senderRole: 'super_admin',
        message: 'Hello Zool Team! Please add a CNAME record pointing `careers.zool.in` to `custom.hiresort.ai`. Once added, our SSL certificate provisioner will automatically activate.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'tkt-102',
    clientId: '00000000-0000-0000-0000-000000000002',
    clientName: 'Commit',
    userId: 'usr-3',
    userEmail: 'admin@commit.com',
    subject: 'Candidate resume PDF upload timeout on large files',
    category: 'bug',
    priority: 'medium',
    status: 'open',
    description: 'One of our candidates reported an upload failure with a 14MB PDF portfolio. Does HireSort have an upload file size ceiling?',
    attachments: [],
    messages: [
      {
        id: 'msg-3',
        ticketId: 'tkt-102',
        senderId: 'usr-3',
        senderEmail: 'admin@commit.com',
        senderRole: 'client_admin',
        message: 'One of our candidates reported an upload failure with a 14MB PDF portfolio. Does HireSort have an upload file size ceiling?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
  }
];

export async function fetchSupportTickets(clientId?: string): Promise<SupportTicket[]> {
  // 1. Try Supabase
  try {
    let query = supabase.from('support_tickets').select('*, support_ticket_messages(*)').order('created_at', { ascending: false });
    if (clientId && clientId !== 'hiresort-platform-hq') {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: d.client_name || 'Workspace',
        userId: d.user_id,
        userEmail: d.user_email,
        subject: d.subject,
        category: d.category as TicketCategory,
        priority: d.priority as TicketPriority,
        status: d.status as TicketStatus,
        description: d.description,
        attachments: d.attachments || [],
        messages: (d.support_ticket_messages || []).map((m: any) => ({
          id: m.id,
          ticketId: m.ticket_id,
          senderId: m.sender_id,
          senderEmail: m.sender_email,
          senderRole: m.sender_role,
          message: m.message,
          createdAt: m.created_at
        })),
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        resolvedAt: d.resolved_at
      }));
    }
  } catch (e) {
    console.warn('Could not load tickets from Supabase, using cached store:', e);
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (raw) {
      const parsed: SupportTicket[] = JSON.parse(raw);
      if (clientId && clientId !== 'hiresort-platform-hq') {
        return parsed.filter(t => t.clientId === clientId);
      }
      return parsed;
    }
  } catch (e) {}

  // 3. Fallback to demo seeds
  localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(SEED_DEMO_TICKETS));
  if (clientId && clientId !== 'hiresort-platform-hq') {
    return SEED_DEMO_TICKETS.filter(t => t.clientId === clientId);
  }
  return SEED_DEMO_TICKETS;
}

export async function createSupportTicket(ticketData: {
  clientId: string;
  clientName: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  attachments?: string[];
}): Promise<SupportTicket> {
  const newId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const initialMsg: TicketMessage = {
    id: `msg-${Date.now()}-1`,
    ticketId: newId,
    senderId: ticketData.userId,
    senderEmail: ticketData.userEmail,
    senderRole: 'client_admin',
    message: ticketData.description,
    createdAt: new Date().toISOString()
  };

  const newTicket: SupportTicket = {
    id: newId,
    clientId: ticketData.clientId,
    clientName: ticketData.clientName,
    userId: ticketData.userId,
    userEmail: ticketData.userEmail,
    subject: ticketData.subject,
    category: ticketData.category,
    priority: ticketData.priority,
    status: 'open',
    description: ticketData.description,
    attachments: ticketData.attachments || [],
    messages: [initialMsg],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Update localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    const list: SupportTicket[] = raw ? JSON.parse(raw) : [...SEED_DEMO_TICKETS];
    list.unshift(newTicket);
    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(list));
  } catch (e) {}

  // 2. Insert into Supabase
  try {
    await supabase.from('support_tickets').insert([{
      id: newTicket.id,
      client_id: newTicket.clientId,
      client_name: newTicket.clientName,
      user_id: newTicket.userId,
      user_email: newTicket.userEmail,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: newTicket.status,
      description: newTicket.description,
      attachments: newTicket.attachments
    } as any]);

    await supabase.from('support_ticket_messages').insert([{
      id: initialMsg.id,
      ticket_id: initialMsg.ticketId,
      sender_id: initialMsg.senderId,
      sender_email: initialMsg.senderEmail,
      sender_role: initialMsg.senderRole,
      message: initialMsg.message
    } as any]);
  } catch (e) {
    console.warn('Non-blocking Supabase ticket insert:', e);
  }

  return newTicket;
}

export async function addTicketMessage(ticketId: string, message: {
  senderId: string;
  senderEmail: string;
  senderRole: 'super_admin' | 'client_admin' | 'recruiter' | 'support_agent';
  message: string;
}): Promise<TicketMessage> {
  const newMsg: TicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketId,
    senderId: message.senderId,
    senderEmail: message.senderEmail,
    senderRole: message.senderRole,
    message: message.message,
    createdAt: new Date().toISOString()
  };

  // 1. Update localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (raw) {
      const list: SupportTicket[] = JSON.parse(raw);
      const updated = list.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            messages: [...t.messages, newMsg],
            status: (message.senderRole === 'super_admin' ? 'waiting_on_client' : 'in_progress') as TicketStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(updated));
    }
  } catch (e) {}

  // 2. Insert into Supabase
  try {
    await supabase.from('support_ticket_messages').insert([{
      id: newMsg.id,
      ticket_id: newMsg.ticketId,
      sender_id: newMsg.senderId,
      sender_email: newMsg.senderEmail,
      sender_role: newMsg.senderRole,
      message: newMsg.message
    } as any]);

    await supabase.from('support_tickets').update({
      status: message.senderRole === 'super_admin' ? 'waiting_on_client' : 'in_progress',
      updated_at: new Date().toISOString()
    } as any).eq('id', ticketId);
  } catch (e) {
    console.warn('Non-blocking Supabase ticket message insert:', e);
  }

  return newMsg;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  // 1. Update localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (raw) {
      const list: SupportTicket[] = JSON.parse(raw);
      const updated = list.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status,
            resolvedAt: (status === 'resolved' || status === 'closed') ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(updated));
    }
  } catch (e) {}

  // 2. Update Supabase
  try {
    await supabase.from('support_tickets').update({
      status,
      resolved_at: (status === 'resolved' || status === 'closed') ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    } as any).eq('id', ticketId);
  } catch (e) {
    console.warn('Non-blocking Supabase ticket status update:', e);
  }
}
