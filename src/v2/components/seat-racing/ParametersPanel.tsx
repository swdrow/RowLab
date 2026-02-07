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
    <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
      </div>
      <div className="ml-4 text-right">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-6">
        <div className="text-red-600 dark:text-red-400 text-center">
          Failed to load rating parameters
        </div>
      </div>
    );
  }

  if (!parameters) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Rating Parameters
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Current configuration for ELO rating calculations
        </p>
      </div>

      <div className="px-6 py-2 divide-y divide-gray-200 dark:divide-gray-700">
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
