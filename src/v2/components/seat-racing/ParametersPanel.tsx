import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ApiResponse } from '../../types/seatRacing';

/**
 * Rating parameters from the API
 */
interface RatingParameters {
  kFactor: number;
  defaultRating: number;
  drawThreshold: number;
  marginScaling: boolean;
  maxMarginFactor: number;
}

/**
 * Fetch rating parameters
 */
async function fetchRatingParameters(): Promise<RatingParameters> {
  const response = await api.get<ApiResponse<{ parameters: RatingParameters }>>(
    '/api/v1/ratings/parameters'
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch rating parameters');
  }

  return response.data.data.parameters;
}

/**
 * Parameter row component for consistent styling
 */
interface ParameterRowProps {
  label: string;
  value: string | number;
  description: string;
}

function ParameterRow({ label, value, description }: ParameterRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-bdr-default last:border-b-0">
      <div className="flex-1">
        <div className="font-medium text-txt-primary">{label}</div>
        <div className="text-sm text-txt-secondary mt-1">{description}</div>
      </div>
      <div className="ml-4 text-right">
        <div className="text-lg font-semibold font-mono text-txt-primary">{value}</div>
      </div>
    </div>
  );
}

/**
 * ParametersPanel Component (SEAT-10)
 *
 * Displays current rating parameters in read-only format.
 * For Phase 9 MVP, this is informational only - editing will be added in future phases.
 */
export function ParametersPanel() {
  const { isAuthenticated, isInitialized } = useAuth();

  const {
    data: parameters,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ratingParameters'],
    queryFn: fetchRatingParameters,
    enabled: isInitialized && isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 hour - parameters rarely change
  });

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-lg border border-bdr-default p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-surface rounded-lg border border-[var(--data-poor)]/20 p-6">
        <div className="text-[var(--data-poor)] text-center">Failed to load rating parameters</div>
      </div>
    );
  }

  if (!parameters) {
    return null;
  }

  return (
    <div className="bg-bg-surface rounded-lg border border-bdr-default">
      <div className="px-6 py-4 border-b border-bdr-default">
        <h3 className="text-lg font-semibold text-txt-primary">Rating Parameters</h3>
        <p className="text-sm text-txt-secondary mt-1">
          Current configuration for ELO rating calculations
        </p>
      </div>

      <div className="px-6 py-2 divide-y divide-bdr-default">
        <ParameterRow
          label="K-Factor"
          value={parameters.kFactor}
          description="Rating volatility - higher values mean larger rating changes per race"
        />
        <ParameterRow
          label="Default Rating"
          value={parameters.defaultRating}
          description="Starting rating for new athletes"
        />
        <ParameterRow
          label="Draw Threshold"
          value={`${parameters.drawThreshold}s`}
          description="Time difference below which races are considered draws"
        />
        <ParameterRow
          label="Margin Scaling"
          value={parameters.marginScaling ? 'Enabled' : 'Disabled'}
          description="Larger margins result in greater rating changes"
        />
        {parameters.marginScaling && (
          <ParameterRow
            label="Max Margin Factor"
            value={`${parameters.maxMarginFactor}x`}
            description="Maximum multiplier for margin scaling effect"
          />
        )}
      </div>
    </div>
  );
}

export type ParametersPanelProps = Record<string, never>;
