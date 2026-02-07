import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type {
  SeatRaceSession,
  SessionWithDetails,
  SessionCreateInput,
  SessionUpdateInput,
  PieceCreateInput,
  PieceUpdateInput,
  BoatCreateInput,
  BoatUpdateInput,
  AssignmentInput,
  ApiResponse,
} from '../types/seatRacing';

/**
 * Options for listing seat race sessions
 */
interface SessionListOptions {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all seat race sessions for active team
 */
async function fetchSeatRaceSessions(options: SessionListOptions = {}): Promise<SeatRaceSession[]> {
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const url = `/api/v1/seat-races${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<ApiResponse<{ sessions: SeatRaceSession[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch seat race sessions');
  }

  return response.data.data.sessions;
}

/**
 * Fetch single seat race session with full details
 */
async function fetchSeatRaceSession(sessionId: string): Promise<SessionWithDetails> {
  const response = await api.get<ApiResponse<{ session: SessionWithDetails }>>(
    `/api/v1/seat-races/${sessionId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch seat race session');
  }

  return response.data.data.session;
}

/**
 * Create new seat race session
 */
async function createSession(data: SessionCreateInput): Promise<SeatRaceSession> {
  const response = await api.post<ApiResponse<{ session: SeatRaceSession }>>(
    '/api/v1/seat-races',
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create seat race session');
  }

  return response.data.data.session;
}

/**
 * Update seat race session
 */
async function updateSession(data: SessionUpdateInput & { id: string }): Promise<SeatRaceSession> {
  const { id, ...updateData } = data;
  const response = await api.patch<ApiResponse<{ session: SeatRaceSession }>>(
    `/api/v1/seat-races/${id}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update seat race session');
  }

  return response.data.data.session;
}

/**
 * Delete seat race session
 */
async function deleteSession(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/seat-races/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete seat race session');
  }
}

/**
 * Add piece to session
 */
async function addPiece(data: PieceCreateInput & { sessionId: string }): Promise<any> {
  const { sessionId, ...pieceData } = data;
  const response = await api.post<ApiResponse<{ piece: any }>>(
    `/api/v1/seat-races/${sessionId}/pieces`,
    pieceData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to add piece');
  }

  return response.data.data.piece;
}

/**
 * Update piece
 */
async function updatePiece(
  data: PieceUpdateInput & { pieceId: string; sessionId: string }
): Promise<any> {
  const { pieceId, sessionId, ...updateData } = data;
  const response = await api.patch<ApiResponse<{ piece: any }>>(
    `/api/v1/seat-races/pieces/${pieceId}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update piece');
  }

  return response.data.data.piece;
}

/**
 * Delete piece
 */
async function deletePiece(data: { pieceId: string; sessionId: string }): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/seat-races/pieces/${data.pieceId}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete piece');
  }
}

/**
 * Add boat to piece
 */
async function addBoat(
  data: BoatCreateInput & { pieceId: string; sessionId: string }
): Promise<any> {
  const { pieceId, sessionId, ...boatData } = data;
  const response = await api.post<ApiResponse<{ boat: any }>>(
    `/api/v1/seat-races/pieces/${pieceId}/boats`,
    boatData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to add boat');
  }

  return response.data.data.boat;
}

/**
 * Update boat
 */
async function updateBoat(
  data: BoatUpdateInput & { boatId: string; sessionId: string }
): Promise<any> {
  const { boatId, sessionId, ...updateData } = data;
  const response = await api.patch<ApiResponse<{ boat: any }>>(
    `/api/v1/seat-races/boats/${boatId}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update boat');
  }

  return response.data.data.boat;
}

/**
 * Delete boat
 */
async function deleteBoat(data: { boatId: string; sessionId: string }): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/seat-races/boats/${data.boatId}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete boat');
  }
}

/**
 * Set all assignments for a boat
 */
async function setAssignments(data: {
  boatId: string;
  sessionId: string;
  assignments: AssignmentInput[];
}): Promise<any> {
  const { boatId, sessionId, assignments } = data;
  const response = await api.put<ApiResponse<{ boat: any }>>(
    `/api/v1/seat-races/boats/${boatId}/assignments`,
    { assignments }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to set boat assignments');
  }

  return response.data.data.boat;
}

/**
 * Process session and calculate ratings
 */
async function processSession(data: { sessionId: string }): Promise<any> {
  const response = await api.post<ApiResponse<any>>(`/api/v1/seat-races/${data.sessionId}/process`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to process session');
  }

  return response.data.data;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching all seat race sessions
 */
export function useSeatRaceSessions(options?: SessionListOptions) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.seatRaces.list(options),
    queryFn: () => fetchSeatRaceSessions(options),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching single seat race session with details
 */
export function useSeatRaceSession(sessionId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.seatRaces.detail(sessionId || ''),
    queryFn: () => fetchSeatRaceSession(sessionId!),
    enabled: isInitialized && isAuthenticated && !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook for creating new seat race session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.all });
    },
  });

  return {
    createSession: mutation.mutate,
    createSessionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

/**
 * Hook for updating seat race session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(updatedSession.id) });
    },
  });

  return {
    updateSession: mutation.mutate,
    updateSessionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

/**
 * Hook for deleting seat race session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.all });
    },
  });

  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

/**
 * Hook for adding piece to session
 */
export function useAddPiece() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addPiece,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    addPiece: mutation.mutate,
    addPieceAsync: mutation.mutateAsync,
    isAddingPiece: mutation.isPending,
    addPieceError: mutation.error,
  };
}

/**
 * Hook for updating piece
 */
export function useUpdatePiece() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updatePiece,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    updatePiece: mutation.mutate,
    updatePieceAsync: mutation.mutateAsync,
    isUpdatingPiece: mutation.isPending,
    updatePieceError: mutation.error,
  };
}

/**
 * Hook for deleting piece
 */
export function useDeletePiece() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deletePiece,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    deletePiece: mutation.mutate,
    deletePieceAsync: mutation.mutateAsync,
    isDeletingPiece: mutation.isPending,
    deletePieceError: mutation.error,
  };
}

/**
 * Hook for adding boat to piece
 */
export function useAddBoat() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addBoat,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    addBoat: mutation.mutate,
    addBoatAsync: mutation.mutateAsync,
    isAddingBoat: mutation.isPending,
    addBoatError: mutation.error,
  };
}

/**
 * Hook for updating boat
 */
export function useUpdateBoat() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateBoat,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    updateBoat: mutation.mutate,
    updateBoatAsync: mutation.mutateAsync,
    isUpdatingBoat: mutation.isPending,
    updateBoatError: mutation.error,
  };
}

/**
 * Hook for deleting boat
 */
export function useDeleteBoat() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteBoat,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    deleteBoat: mutation.mutate,
    deleteBoatAsync: mutation.mutateAsync,
    isDeletingBoat: mutation.isPending,
    deleteBoatError: mutation.error,
  };
}

/**
 * Hook for setting boat assignments
 */
export function useSetAssignments() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: setAssignments,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
    },
  });

  return {
    setAssignments: mutation.mutate,
    setAssignmentsAsync: mutation.mutateAsync,
    isSettingAssignments: mutation.isPending,
    setAssignmentsError: mutation.error,
  };
}

/**
 * Hook for processing session and calculating ratings
 */
export function useProcessSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: processSession,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seatRaces.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
    },
  });

  return {
    processSession: mutation.mutate,
    processSessionAsync: mutation.mutateAsync,
    isProcessing: mutation.isPending,
    processError: mutation.error,
  };
}
