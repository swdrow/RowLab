import { useEffect, useRef, useMemo, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { useComparisonGraph } from '../../hooks/useAdvancedRankings';
import type { ComparisonNode, ComparisonEdge, ComparisonGap } from '../../types/advancedRanking';

interface ComparisonGraphProps {
  onNodeClick?: (athleteId: string) => void;
  onGapClick?: (gap: ComparisonGap) => void;
  showGaps?: boolean;
  height?: string;
}

export function ComparisonGraph({
  onNodeClick,
  onGapClick,
  showGaps = true,
  height = '400px'
}: ComparisonGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedGap, setSelectedGap] = useState<ComparisonGap | null>(null);

  const { nodes, edges, gaps, statistics, isLoading, error } = useComparisonGraph();

  // Format data for vis-network
  const visData = useMemo(() => {
    // Nodes with styling based on comparison count
    const formattedNodes = nodes.map(node => ({
      id: node.athleteId,
      label: node.label,
      value: Math.max(10, node.comparisonCount * 3), // Size based on comparisons
      title: `${node.label}\n${node.comparisonCount} comparisons`,
      color: getNodeColor(node),
      font: { size: 12, color: '#1f2937' }
    }));

    // Edges with thickness based on comparison count
    const formattedEdges = edges.map((edge, idx) => ({
      id: idx,
      from: edge.from,
      to: edge.to,
      value: edge.comparisons,
      title: `${edge.comparisons} races, avg margin: ${edge.avgMarginSeconds.toFixed(1)}s`,
      color: getEdgeColor(edge),
      width: Math.min(5, 1 + edge.comparisons)
    }));

    return {
      nodes: new DataSet(formattedNodes),
      edges: new DataSet(formattedEdges)
    };
  }, [nodes, edges]);

  // Initialize network
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 15,
          max: 40,
          label: {
            enabled: true,
            min: 12,
            max: 16
          }
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        color: { inherit: 'from' },
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08
        },
        stabilization: {
          iterations: 100
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100
      }
    };

    const network = new Network(containerRef.current, visData, options);
    networkRef.current = network;

    // Handle node click
    network.on('click', (params) => {
      if (params.nodes.length > 0 && onNodeClick) {
        onNodeClick(params.nodes[0]);
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [visData, onNodeClick]);

  const handleGapClick = (gap: ComparisonGap) => {
    setSelectedGap(gap);
    onGapClick?.(gap);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-surface-secondary rounded-lg" style={{ height }}>
        <div className="text-txt-secondary">Loading comparison graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-surface-secondary rounded-lg" style={{ height }}>
        <div className="text-red-500">Failed to load comparison graph</div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center bg-surface-secondary rounded-lg" style={{ height }}>
        <div className="text-txt-secondary">No seat racing data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Graph container */}
      <div
        ref={containerRef}
        className="bg-surface-secondary rounded-lg border border-bdr-primary"
        style={{ height }}
      />

      {/* Statistics bar */}
      <div className="flex items-center gap-6 text-sm text-txt-secondary">
        <span>
          <span className="font-medium text-txt-primary">{statistics?.totalNodes || 0}</span> athletes
        </span>
        <span>
          <span className="font-medium text-txt-primary">{statistics?.totalEdges || 0}</span> comparisons
        </span>
        <span>
          Coverage: <span className="font-medium text-txt-primary">
            {((statistics?.connectivity || 0) * 100).toFixed(0)}%
          </span>
        </span>
        {statistics?.isConnected ? (
          <span className="text-green-600">Fully connected</span>
        ) : (
          <span className="text-amber-600">{statistics?.totalGaps || 0} gaps</span>
        )}
      </div>

      {/* Gaps list */}
      {showGaps && gaps.length > 0 && (
        <div className="bg-surface-secondary rounded-lg p-4">
          <h4 className="text-sm font-medium text-txt-primary mb-2">
            Missing Comparisons ({gaps.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {gaps.slice(0, 10).map((gap, idx) => (
              <button
                key={idx}
                onClick={() => handleGapClick(gap)}
                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover transition-colors ${
                  selectedGap === gap ? 'bg-accent-primary/10 border border-accent-primary' : 'bg-surface-primary'
                }`}
              >
                <span className="text-txt-primary">
                  {gap.athlete1.firstName} {gap.athlete1.lastName}
                </span>
                <span className="text-txt-secondary mx-2">vs</span>
                <span className="text-txt-primary">
                  {gap.athlete2.firstName} {gap.athlete2.lastName}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  gap.priority === 'high' ? 'bg-red-100 text-red-700' :
                  gap.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {gap.priority}
                </span>
              </button>
            ))}
            {gaps.length > 10 && (
              <p className="text-xs text-txt-secondary text-center py-2">
                +{gaps.length - 10} more gaps
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for node/edge coloring
function getNodeColor(node: ComparisonNode): string {
  // Color by side
  if (node.side === 'Port') return '#ef4444'; // red
  if (node.side === 'Starboard') return '#22c55e'; // green
  if (node.side === 'Cox') return '#3b82f6'; // blue
  return '#6b7280'; // gray for unknown
}

function getEdgeColor(edge: ComparisonEdge): { color: string; highlight: string } {
  // More comparisons = darker/more saturated
  const intensity = Math.min(1, edge.comparisons / 5);
  const baseColor = `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`; // blue with varying opacity

  return {
    color: baseColor,
    highlight: '#2563eb'
  };
}

export default ComparisonGraph;
