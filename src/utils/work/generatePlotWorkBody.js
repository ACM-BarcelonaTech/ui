import { plotTypes } from 'utils/constants';

const composeDotPlotWorkBody = (config) => {
  const [filterGroup, filterKey] = config.selectedPoints.split('/');

  return {
    name: plotTypes.DOT_PLOT,
    useMarkerGenes: config.useMarkerGenes,
    numberOfMarkers: config.nMarkerGenes,
    customGenesList: config.selectedGenes,
    groupBy: config.selectedCellSet,
    filterBy: {
      group: filterGroup,
      key: filterKey || 'All',
    },
  };
};

const generatePlotWorkBody = (plotType, config) => {
  switch (plotType) {
    case plotTypes.DOT_PLOT:
      return composeDotPlotWorkBody(config);
    default: {
      throw new Error('Plot type doesn\'t exist');
    }
  }
};

export default generatePlotWorkBody;
