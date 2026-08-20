import { api } from './axios';

export async function subscribeNewsletterRequest(email: string): Promise<void> {
  await api.post('/newsletter/subscribe', { email });
}
