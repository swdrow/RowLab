/**
 * Share card API functions.
 */
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GenerateRequest, ShareCard } from './types';

export function useGenerateShareCard() {
  return useMutation({
    mutationFn: async (request: GenerateRequest): Promise<ShareCard> => {
      const res = await api.post('/api/v1/share-cards/generate', request);
      return res.data as ShareCard;
    },
  });
}

export async function fetchShareCard(shareId: string): Promise<ShareCard> {
  const res = await api.get(`/api/v1/share-cards/${shareId}`);
  return res.data as ShareCard;
}

export async function deleteShareCard(shareId: string): Promise<void> {
  await api.delete(`/api/v1/share-cards/${shareId}`);
}
