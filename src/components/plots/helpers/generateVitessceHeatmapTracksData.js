import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import { hexToRgb } from 'utils/heatmapPlotHelperFunctions/helpers';

const generateVitessceHeatmapTracksData = (trackOrder, hierarchy, properties, cells) => {
  const colorForCell = (cellId, trackKey) => {
    // getCellClassProperties returns all the possible colors this cell could show
    // Always pick the first one of these so that we always try to resolve with the same logic
    const { color: cellColor = null } = getCellClassProperties(
      cellId,
      trackKey,
      hierarchy,
      properties,
    )[0] ?? {};

    return hexToRgb(cellColor) ?? hexToRgb('#f5f8fa');
  };

  const cellIdsColorsMap = new Map();

  cells.forEach((cellId) => {
    const allColorsForCell = trackOrder.map((trackKey) => colorForCell(cellId, trackKey));

    cellIdsColorsMap.set(`${cellId}`, allColorsForCell);
  });

  return cellIdsColorsMap;
};

export default generateVitessceHeatmapTracksData;
