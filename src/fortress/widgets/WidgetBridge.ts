import { buildingMetadata, getBuildingModule } from '../core/Registry';

export interface BuildingWidgetConfig {
  id: string;
  title: string;
  description: string;
  widgetType: string;
  bindings: Record<string, unknown>;
}

export const toWidget = (buildingId: string): BuildingWidgetConfig | null => {
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
  buildingMetadata
    .map((meta) => toWidget(meta.id))
    .filter((config): config is BuildingWidgetConfig => Boolean(config));
