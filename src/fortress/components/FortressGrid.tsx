import React from 'react';
import { AvotNpc } from '../avots/AvotRegistry';

interface FortressGridProps {
  grid: (string | null)[][];
  unlockedBuildings: string[];
  selectedBuildingId?: string | null;
  onSelect: (buildingId: string) => void;
  avotsByBuilding?: Record<string, AvotNpc[]>;
}

export const FortressGrid: React.FC<FortressGridProps> = ({
  grid,
  unlockedBuildings,
  selectedBuildingId,
  onSelect,
  avotsByBuilding,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: '100%',
      }}
    >
      {grid.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const buildingId = cell;
          const unlocked = buildingId ? unlockedBuildings.includes(buildingId) : false;
          const isSelected = buildingId && selectedBuildingId === buildingId;
          const label = buildingId ?? 'Empty';
          const key = `${rowIndex}-${colIndex}`;
          const avotsHere = buildingId && avotsByBuilding ? avotsByBuilding[buildingId] ?? [] : [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => buildingId && unlocked && onSelect(buildingId)}
              style={{
                minHeight: 80,
                borderRadius: 12,
                border: isSelected ? '2px solid #1dd1a1' : '1px solid rgba(255,255,255,0.1)',
                background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(52,73,94,0.3)',
                color: unlocked ? '#ecf0f1' : '#95a5a6',
                cursor: buildingId && unlocked ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 8,
                boxShadow: isSelected ? '0 0 0 3px rgba(29,209,161,0.2)' : 'none',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {buildingId ? (unlocked ? 'Unlocked' : 'Locked') : 'No building'}
                </div>
              </div>
              {avotsHere.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    display: 'flex',
                    gap: 4,
                  }}
                >
                  {avotsHere.slice(0, 3).map((avot) => (
                    <span
                      key={`${avot.id}-${buildingId}`}
                      title={`${avot.id} (${avot.mood})`}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(29, 209, 161, 0.15)',
                        border: '1px solid rgba(29,209,161,0.5)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: '#1dd1a1',
                      }}
                    >
                      {avot.id.slice(0, 1)}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
};
