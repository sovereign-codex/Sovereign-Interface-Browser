import { buildingMetadata, getBuildingModule } from '../core/Registry';

export interface BuildingWidgetConfig {
  id: string;
  title: string;
  description: string;
  widgetType: string;
  bindings: Record<string, unknown>;
}

export const toWidget = (buildingId: string): BuildingWidgetConfig | null => {
  if (buildingId === 'FortressOverview') {
    return {
      id: 'FortressOverview',
      title: 'Fortress Overview',
      description: 'Compact Fortress grid and Town Hall summary.',
      widgetType: 'FortressWidget',
      bindings: {
        modulePath: 'src/fortress/widgets/FortressWidget.tsx',
        module: 'FortressWidget',
      },
    } satisfies BuildingWidgetConfig;
  }

  if (buildingId === 'CrownSpire') {
    return {
      id: 'CrownSpire',
      title: 'Crown Spire',
      description: 'High-level coherence, momentum, and guidance widget.',
      widgetType: 'CrownSpireWidget',
      bindings: {
        modulePath: 'src/fortress/widgets/CrownSpireWidget.tsx',
        module: 'CrownSpireWidget',
      },
    } satisfies BuildingWidgetConfig;
  }

  const meta = buildingMetadata.find((item) => item.id === buildingId);
  if (!meta) return null;

  return {
    id: buildingId,
    title: meta.title,
    description: meta.description,
    widgetType: `${buildingId}Widget`,
    bindings: {
      modulePath: meta.path,
      module: getBuildingModule(buildingId),
    },
  } satisfies BuildingWidgetConfig;
};

export const getBuildingWidgetConfig = (buildingId: string): BuildingWidgetConfig | null => toWidget(buildingId);

export const listBuildingWidgets = (): BuildingWidgetConfig[] =>
  [toWidget('FortressOverview'), toWidget('CrownSpire'), ...buildingMetadata.map((meta) => toWidget(meta.id))]
    .filter((config): config is BuildingWidgetConfig => Boolean(config));
