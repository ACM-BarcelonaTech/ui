import React from 'react';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  initialPlotConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';
import { loadGeneExpression } from '../../../redux/actions/genes/index';
import * as markerGenesLoaded from '../../../redux/reducers/genes/markerGenesLoaded';
import * as geneExpressionLoaded from '../../../redux/reducers/genes/geneOrderSet';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import rootReducer from '../../../redux/reducers/index';
import * as loadConfig from '../../../redux/reducers/componentConfig/loadConfig';
import MarkerHeatmap from '../../../pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import { fetchCachedWork } from '../../../utils/cacheRequest';

jest.mock('localforage');
enableFetchMocks();
jest.mock('../../../components/plots/Header', () => () => <div />);

jest.mock('../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn().mockImplementation((expId, body) => {
    if (body.name === 'ListGenes') {
      return new Promise((resolve) => resolve({
        rows: [{ gene_names: 'MockGeneWithHighestDispersion', dispersions: 54.0228 }],
      }));
    }
    if (body.name === 'MarkerHeatmap') {
      return new Promise((resolve) => {
        resolve('resolved');
      });
    }
    if (body.name === 'GeneExpression') {
      return new Promise((resolve) => {
        const requestedExpression = {};
        body.genes.forEach((geneName) => {
          requestedExpression[geneName] = {
            rawExpression: { expression: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 4, 5, 0, 0, 0, 0] },
          };
        });
        resolve(requestedExpression);
      });
    }
  }),
}));
const plotUuid = 'markerHeatmapPlotMain';

const defaultStore = {
  componentConfig: { [plotUuid]: { config: initialPlotConfigStates.markerHeatmap } },
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
    backendStatus: {
      status: {
        pipeline: {
          startDate: '2020-01-01T00:00:00',
          status: 'SUCEEDED',
        },
        worker: { status: 'Running' },
        gem2s: { status: 'SUCCEEDED' },
      },
    },
    processing: {
      configureEmbedding: {
        clusteringSettings: {
          methodSettings: {
            louvain: {
              resolution: 0.8,
            },
          },
        },
      },
    },
  },
  cellSets: {
    loading: false,
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
          {
            key: 'louvain-2',
          },
          {
            key: 'louvain-3',
          },
        ],
      },
    ],
    properties: {
      louvain: {
        type: 'cellSets',
        cellIds: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      },
      'louvain-0': {
        name: 'Cluster 0',
        color: '#e377c2',
        cellIds: new Set([1, 2, 3, 4]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-1': {
        name: 'Cluster 1',
        color: '#8c564b',
        cellIds: new Set([5, 6, 7, 8]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-2': {
        name: 'Cluster 2',
        color: '#d62728',
        cellIds: new Set([9, 10, 11, 12]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-3': {
        name: 'Cluster 3',
        color: '#2ca02c',
        cellIds: new Set([13, 14, 15, 16]),
        rootNode: false,
        type: 'cellSets',
      },
      views: [],
    },
    hidden: 'Set()',
  },
  genes: {
    markers: {
      order: ['gene0', 'gene1', 'gene3'],
    },
    expression: {
      loading: [],

      data: {
        gene0: {
          rawExpression: { expression: [5, 5, 5, 5, 0, 4, 4, 4, 2, 3, 4, 5, 0, 0, 4, 5] },
        },
        gene1: {
          rawExpression: { expression: [1, 2, 3, 4, 5, 4, 5, 5, 3, 0, 0, 0, 0, 0, 0, 0] },
        },
        gene3: {
          rawExpression: { expression: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0] },
        },
      },
      views: {
        [plotUuid]: {
          data: ['gene0', 'gene1', 'gene3'],
        },
      },
    },
    properties: { views: { [plotUuid]: [] } },
  },
};

const experimentId = 'randomExperiment';
let store = null;
let loadConfigSpy = null;
let loadMarkersSpy;
let genesLoadedSpy;

const renderHeatmapPage = async () => {
  store = createStore(rootReducer, _.cloneDeep(defaultStore), applyMiddleware(thunk));

  rtl.render(
    <Provider store={store}>
      <MarkerHeatmap
        experimentId={experimentId}
      />
    </Provider>,
  );
  await rtl.waitFor(() => expect(loadConfigSpy).toHaveBeenCalledTimes(1));
};

describe('Marker heatmap plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}), { status: 404, statusText: '404 Not Found' });
    loadConfigSpy = jest.spyOn(loadConfig, 'default');
    loadMarkersSpy = jest.spyOn(markerGenesLoaded, 'default');
    genesLoadedSpy = jest.spyOn(geneExpressionLoaded, 'default');
  });

  // marker heatmap renders
  it('loads initially', async () => {
    await renderHeatmapPage();

    expect(loadMarkersSpy).toHaveBeenCalled();
  });

  it('loads marker genes on selecting', async () => {
    await renderHeatmapPage();

    const geneSelection = rtl.screen.getByText('Gene selection');
    userEvent.click(geneSelection);
    const nGenesInput = rtl.getByTestId(geneSelection.parentElement, 'num-genes');
    userEvent.type(nGenesInput, 10);

    const runButton = rtl.getByText(geneSelection.parentElement, 'Run');
    userEvent.click(runButton);

    expect(loadMarkersSpy).toHaveBeenCalled();
  });

  it('sorts genes properly', async () => {
    await renderHeatmapPage();
    const geneSelection = rtl.screen.getByText('Gene selection');
    userEvent.click(geneSelection);
    store.dispatch(loadGeneExpression(experimentId, ['gene0', 'gene1', 'gene3', 'gene2'], plotUuid));

    await rtl.waitFor(() => expect(fetchCachedWork).toHaveBeenCalledTimes(2));
    await rtl.waitFor(() => expect(genesLoadedSpy).toHaveBeenCalled());

    expect(store.getState().genes.markers.order).toEqual(['gene0', 'gene1', 'gene2', 'gene3']);
  });
});
