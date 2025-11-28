import React from 'react';
import { CrownSpireState, SpireInsight, SpireRecommendation } from '../crown/CrownTypes';

interface Props {
  state: CrownSpireState | null;
  onRunCommand: (cmd: string) => void;
  onFocusBuilding: (id: string) => void;
}

const MetricBar: React.FC<{ label: string; value: number; trend?: string; notes?: string }> = ({
  label,
  value,
  trend,
  notes,
}) => {
  const width = Math.min(100, Math.max(0, value));
  const trendSymbol = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#95a5a6' }}>
        <span>{label}</span>
        <span>
          {Math.round(value)} {trend ? trendSymbol : ''}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            borderRadius: 6,
            background: 'linear-gradient(90deg, #7ed6df, #6c5ce7)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {notes && <div style={{ fontSize: 11, color: '#bdc3c7' }}>{notes}</div>}
    </div>
  );
};

const InsightItem: React.FC<{ insight: SpireInsight }> = ({ insight }) => {
  const priorityColors: Record<SpireInsight['priority'], string> = {
    low: '#2ecc71',
    medium: '#f1c40f',
    high: '#e74c3c',
  };
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 8,
          borderRadius: 8,
          background: priorityColors[insight.priority],
          boxShadow: `0 0 12px ${priorityColors[insight.priority]}55`,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontWeight: 700 }}>{insight.summary}</div>
        {insight.detail && <div style={{ fontSize: 12, color: '#95a5a6' }}>{insight.detail}</div>}
        <div style={{ fontSize: 11, color: '#7f8c8d' }}>
          Priority: {insight.priority} · Domain: {insight.domain}
        </div>
      </div>
    </div>
  );
};

const RecommendationItem: React.FC<{
  recommendation: SpireRecommendation;
  onRunCommand: (cmd: string) => void;
  onFocusBuilding: (id: string) => void;
}> = ({ recommendation, onRunCommand, onFocusBuilding }) => {
  const hasCommands = (recommendation.suggestedCommands?.length ?? 0) > 0;
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{recommendation.label}</div>
          {recommendation.description && (
            <div style={{ fontSize: 12, color: '#95a5a6' }}>{recommendation.description}</div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bdc3c7' }}>{recommendation.priority.toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {hasCommands &&
          recommendation.suggestedCommands?.map((cmd) => (
            <button
              type="button"
              key={cmd}
              onClick={() => onRunCommand(cmd)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(52,152,219,0.12)',
                color: '#ecf0f1',
                cursor: 'pointer',
              }}
            >
              Run {cmd}
            </button>
          ))}
        {recommendation.suggestedBuildingId && (
          <button
            type="button"
            onClick={() => onFocusBuilding(recommendation.suggestedBuildingId as string)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(46,204,113,0.12)',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          >
            Focus on {recommendation.suggestedBuildingId}
          </button>
        )}
      </div>
    </div>
  );
};

export const CrownSpirePanel: React.FC<Props> = ({ state, onRunCommand, onFocusBuilding }) => {
  const metrics = state?.metrics ?? [];
  const insights = state?.insights ?? [];
  const recommendations = state?.recommendations ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>Crown Spire</div>
        <div style={{ fontSize: 12, color: '#95a5a6' }}>
          {state?.lastScanAt ? `Last scan: ${new Date(state.lastScanAt).toLocaleTimeString()}` : 'Awaiting scan...'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {metrics.map((metric) => (
          <div
            key={metric.id}
            style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
          >
            <MetricBar label={metric.label} value={metric.value} trend={metric.trend} notes={metric.notes} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Insights</div>
        {insights.length === 0 && <div style={{ fontSize: 12, color: '#95a5a6' }}>No insights yet. Run a scan to collect signals.</div>}
        {insights.map((insight) => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Recommendations</div>
        {recommendations.length === 0 && (
          <div style={{ fontSize: 12, color: '#95a5a6' }}>No recommendations yet. Check back after the next scan.</div>
        )}
        {recommendations.map((rec) => (
          <RecommendationItem
            key={rec.id}
            recommendation={rec}
            onRunCommand={onRunCommand}
            onFocusBuilding={onFocusBuilding}
          />
        ))}
      </div>
    </div>
  );
};
