import React from 'react';
import { Quest } from '../quests/QuestTypes';

interface QuestPanelProps {
  buildingId?: string | null;
  quests: Quest[];
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
}

const statusColor: Record<Quest['status'], string> = {
  available: '#27ae60',
  accepted: '#2980b9',
  completed: '#8e44ad',
  failed: '#c0392b',
};

const QuestBadge: React.FC<{ status: Quest['status'] }> = ({ status }) => (
  <span
    style={{
      padding: '4px 8px',
      borderRadius: 12,
      fontSize: 11,
      background: `${statusColor[status]}20`,
      color: statusColor[status],
      border: `1px solid ${statusColor[status]}30`,
    }}
  >
    {status.toUpperCase()}
  </span>
);

const renderRequirements = (quest: Quest): string => {
  if (!quest.requirements.length) return 'No requirements';
  return quest.requirements
    .map((req) => {
      switch (req.type) {
        case 'xp-domain-min':
          return `XP ${req.domain} ≥ ${req.value}`;
        case 'trait-min-level':
          return `Trait ${req.traitId} ≥ ${req.value}`;
        case 'building-unlocked':
          return `Unlock ${req.buildingId}`;
        case 'talos-event':
          return `Talos event ${req.eventId}`;
        default:
          return String(req.type);
      }
    })
    .join(' • ');
};

const renderRewards = (quest: Quest): string => {
  const rewards: string[] = [];
  quest.rewards.xp?.forEach((item) => rewards.push(`+${item.amount} ${item.domain} XP`));
  quest.rewards.traits?.forEach((item) => rewards.push(`Trait ${item.traitId} +${item.levels}`));
  quest.rewards.unlockBuildings?.forEach((id) => rewards.push(`Unlock ${id}`));
  if (quest.rewards.notes) rewards.push(quest.rewards.notes);
  return rewards.length ? rewards.join(' • ') : 'No rewards listed';
};

const QuestCard: React.FC<{
  quest: Quest;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
}> = ({ quest, onAccept, onComplete }) => (
  <div
    style={{
      padding: 12,
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{quest.title}</div>
        <div style={{ fontSize: 11, color: '#b2bec3' }}>{quest.offeredBy ? `Offered by ${quest.offeredBy}` : 'Quest'}</div>
      </div>
      <QuestBadge status={quest.status} />
    </div>
    <div style={{ fontSize: 12, color: '#ecf0f1' }}>{quest.description}</div>
    <div style={{ fontSize: 11, color: '#95a5a6' }}>Requirements: {renderRequirements(quest)}</div>
    <div style={{ fontSize: 11, color: '#95a5a6' }}>Rewards: {renderRewards(quest)}</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
      {quest.status === 'available' && (
        <button
          type="button"
          onClick={() => onAccept(quest.id)}
          style={{
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(46,204,113,0.4)',
            background: 'rgba(46,204,113,0.1)',
            color: '#ecf0f1',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Accept
        </button>
      )}
      {quest.status === 'accepted' && (
        <button
          type="button"
          onClick={() => onComplete(quest.id)}
          style={{
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(41,128,185,0.4)',
            background: 'rgba(41,128,185,0.12)',
            color: '#ecf0f1',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Complete
        </button>
      )}
      <span style={{ fontSize: 11, color: '#95a5a6', alignSelf: 'center' }}>
        {quest.buildingId ? `Building: ${quest.buildingId}` : 'Fortress quest'}
      </span>
    </div>
  </div>
);

export const QuestPanel: React.FC<QuestPanelProps> = ({ buildingId, quests, onAccept, onComplete }) => {
  const relevant = quests.filter((quest) => !buildingId || quest.buildingId === buildingId);
  const active = relevant.filter((quest) => quest.status === 'accepted');
  const available = relevant.filter((quest) => quest.status === 'available');
  const completed = relevant.filter((quest) => quest.status === 'completed');
  const isPortalGate = buildingId === 'PortalGate';

  if (!relevant.length) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          border: '1px dashed rgba(255,255,255,0.1)',
          color: '#95a5a6',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        No quests to show for this building yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        border: isPortalGate ? '1px solid rgba(155, 89, 182, 0.4)' : '1px solid rgba(255,255,255,0.08)',
        background: isPortalGate ? 'rgba(155, 89, 182, 0.08)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Quests</div>
        {buildingId && <div style={{ fontSize: 11, color: '#95a5a6' }}>Building: {buildingId}</div>}
      </div>

      {active.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3498db' }}>Active</div>
          {active.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onAccept={onAccept} onComplete={onComplete} />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2ecc71' }}>Available</div>
          {available.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onAccept={onAccept} onComplete={onComplete} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <details style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#95a5a6' }}>
            Completed ({completed.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {completed.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onAccept={onAccept} onComplete={onComplete} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
