/**
 * Share card API functions.
 */
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { GenerateRequest, GenerateResponse, ShareCard } from './types';

export function useGenerateShareCard() {
  return useMutation({
    mutationFn: async (request: GenerateRequest): Promise<ShareCard> => {
      const data = await apiClient.post<GenerateResponse>('/api/v1/share-cards/generate', request);
      // Map backend response shape to UI-friendly ShareCard
      return {
        id: data.shareId,
        url: data.url,
        publicUrl: data.publicUrl,
        cardType: request.cardType,
      };
    },
  });
}

export async function fetchShareCard(shareId: string): Promise<ShareCard> {
  return apiClient.get<ShareCard>(`/api/v1/share-cards/${shareId}`);
}

export async function deleteShareCard(shareId: string): Promise<void> {
  await apiClient.delete(`/api/v1/share-cards/${shareId}`);
}
