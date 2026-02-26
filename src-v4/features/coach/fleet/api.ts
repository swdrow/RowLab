/**
 * Fleet equipment API functions and query option factories.
 *
 * Endpoints use the existing /api/v1/shells and /api/v1/oar-sets routes.
 * All query keys are team-scoped for safe team-switch invalidation.
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Shell,
  OarSet,
  CreateShellInput,
  UpdateShellInput,
  CreateOarSetInput,
  UpdateOarSetInput,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory (team-scoped)
// ---------------------------------------------------------------------------

export const fleetKeys = {
  all: (teamId: string) => ['fleet', teamId] as const,
  shells: (teamId: string) => ['fleet', teamId, 'shells'] as const,
  oarSets: (teamId: string) => ['fleet', teamId, 'oarSets'] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

async function fetchShells(teamId: string): Promise<Shell[]> {
  const res = await api.get('/api/v1/shells', { params: { teamId } });
  const data = res.data;
  // Backend wraps in { success, data: { shells } }
  return (data.data?.shells ?? data.shells ?? []) as Shell[];
}

async function fetchOarSets(teamId: string): Promise<OarSet[]> {
  const res = await api.get('/api/v1/oar-sets', { params: { teamId } });
  const data = res.data;
  return (data.data?.oarSets ?? data.oarSets ?? []) as OarSet[];
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

async function createShell(input: CreateShellInput): Promise<Shell> {
  const res = await api.post('/api/v1/shells', input);
  return (res.data.data ?? res.data) as Shell;
}

async function updateShell(id: string, input: UpdateShellInput): Promise<Shell> {
  const res = await api.put(`/api/v1/shells/${id}`, input);
  return (res.data.data ?? res.data) as Shell;
}

async function deleteShell(id: string): Promise<void> {
  await api.delete(`/api/v1/shells/${id}`);
}

async function createOarSet(input: CreateOarSetInput): Promise<OarSet> {
  const res = await api.post('/api/v1/oar-sets', input);
  return (res.data.data ?? res.data) as OarSet;
}

async function updateOarSet(id: string, input: UpdateOarSetInput): Promise<OarSet> {
  const res = await api.put(`/api/v1/oar-sets/${id}`, input);
  return (res.data.data ?? res.data) as OarSet;
}

async function deleteOarSet(id: string): Promise<void> {
  await api.delete(`/api/v1/oar-sets/${id}`);
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function shellsOptions(teamId: string) {
  return queryOptions<Shell[]>({
    queryKey: fleetKeys.shells(teamId),
    queryFn: () => fetchShells(teamId),
    staleTime: 5 * 60_000, // Equipment changes rarely
    enabled: !!teamId,
  });
}

export function oarSetsOptions(teamId: string) {
  return queryOptions<OarSet[]>({
    queryKey: fleetKeys.oarSets(teamId),
    queryFn: () => fetchOarSets(teamId),
    staleTime: 5 * 60_000,
    enabled: !!teamId,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateShell(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShellInput) => createShell(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: fleetKeys.shells(teamId) });
      const prev = qc.getQueryData<Shell[]>(fleetKeys.shells(teamId));
      qc.setQueryData<Shell[]>(fleetKeys.shells(teamId), (old = []) => [
        ...old,
        {
          ...input,
          id: `temp-${Date.now()}`,
          teamId,
          status: input.status ?? 'AVAILABLE',
        } as Shell,
      ]);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.shells(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.shells(teamId) });
    },
  });
}

export function useUpdateShell(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShellInput }) => updateShell(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: fleetKeys.shells(teamId) });
      const prev = qc.getQueryData<Shell[]>(fleetKeys.shells(teamId));
      qc.setQueryData<Shell[]>(fleetKeys.shells(teamId), (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...input } : s))
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.shells(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.shells(teamId) });
    },
  });
}

export function useDeleteShell(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShell(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: fleetKeys.shells(teamId) });
      const prev = qc.getQueryData<Shell[]>(fleetKeys.shells(teamId));
      qc.setQueryData<Shell[]>(fleetKeys.shells(teamId), (old = []) =>
        old.filter((s) => s.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.shells(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.shells(teamId) });
    },
  });
}

export function useCreateOarSet(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOarSetInput) => createOarSet(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: fleetKeys.oarSets(teamId) });
      const prev = qc.getQueryData<OarSet[]>(fleetKeys.oarSets(teamId));
      qc.setQueryData<OarSet[]>(fleetKeys.oarSets(teamId), (old = []) => [
        ...old,
        {
          ...input,
          id: `temp-${Date.now()}`,
          teamId,
          status: input.status ?? 'AVAILABLE',
        } as OarSet,
      ]);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.oarSets(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.oarSets(teamId) });
    },
  });
}

export function useUpdateOarSet(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOarSetInput }) =>
      updateOarSet(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: fleetKeys.oarSets(teamId) });
      const prev = qc.getQueryData<OarSet[]>(fleetKeys.oarSets(teamId));
      qc.setQueryData<OarSet[]>(fleetKeys.oarSets(teamId), (old = []) =>
        old.map((o) => (o.id === id ? { ...o, ...input } : o))
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.oarSets(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.oarSets(teamId) });
    },
  });
}

export function useDeleteOarSet(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOarSet(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: fleetKeys.oarSets(teamId) });
      const prev = qc.getQueryData<OarSet[]>(fleetKeys.oarSets(teamId));
      qc.setQueryData<OarSet[]>(fleetKeys.oarSets(teamId), (old = []) =>
        old.filter((o) => o.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(fleetKeys.oarSets(teamId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: fleetKeys.oarSets(teamId) });
    },
  });
}
