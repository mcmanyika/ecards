export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  createdAt?: string;
}

export interface LeadPayload {
  conversationId?: string;
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  budget: string;
  preferredAppointmentDate: string;
}
