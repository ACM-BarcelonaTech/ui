import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from '../../actionTypes/genes';

import { fetchWork } from '../../../utils/cacheRequest';

const loadMarkerGenes = (
  experimentId, resolution, plotUuid, numGenes = 5,
) => async (dispatch, getState) => {
  // Disabled linter because we are using == to check for both null and undefined values
  // eslint-disable-next-line eqeqeq
  if (experimentId == null || resolution == null) throw new Error('Null or undefined parameter/s for loadMarkerGenes');

  const { backendStatus, processing } = getState().experimentSettings;

  const { method } = processing.configureEmbedding.clusteringSettings;
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    type: method,
    config: {
      resolution,
    },
  };

  dispatch({
    type: MARKER_GENES_LOADING,
  });

  try {
    const data = await fetchWork(experimentId, body, backendStatus.status);
    const { data: markerGeneExpressions, order } = data;

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        experimentId,
        genes: order,
        data: markerGeneExpressions,
        plotUuid,
      },
    });
  } catch (e) {
    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default loadMarkerGenes;
