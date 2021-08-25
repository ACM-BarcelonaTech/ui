import getNumberOfCellsInGrouping from '../redux/getters/getNumberOfCellsInGrouping';

const getTimeoutForWorkerTaskUncapped = (state, taskName, options) => {
  // Get filtered nCells for more accurate timeout//
  // if louvain is not calculated (unlikely) get all nCells
  const nCells = getNumberOfCellsInGrouping('louvain', state) || getNumberOfCellsInGrouping('sample', state);

  switch (taskName) {
    case 'GetEmbedding': {
      const { method } = options;

      if (method === 'umap') return 0.002 * nCells + 60;
      if (method === 'tsne') return 0.02 * nCells + 60;

      break;
    }
    case 'ClusterCells':
    case 'MarkerHeatmap': {
      return 0.002 * nCells + 60;
    }
    case 'DifferentialExpression': {
      return 180;
    }
    case 'ListGenes':
    case 'GeneExpression':
    case 'GetMitochondrialContent':
    case 'GetDoubletScore':
    default: {
      return 60;
    }
  }
};

const getTimeoutForWorkerTask = (state, taskName, options) => (
  Math.max(getTimeoutForWorkerTaskUncapped(state, taskName, options), 60)
);

export default getTimeoutForWorkerTask;
