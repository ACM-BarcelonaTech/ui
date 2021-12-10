import _ from 'lodash';
import React from 'react';
import '__test__/test-utils/setupTests';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { seekFromAPI } from 'utils/work/seekWorkResponse';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';

import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadGeneExpression } from 'redux/actions/genes';

import { loadBackendStatus } from 'redux/actions/backendStatus';

import fake from '__test__/test-utils/constants';

const experimentId = fake.EXPERIMENT_ID;

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => `${ETagParams.body.nGenes}-marker-genes`;
  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  seekFromAPI: jest.fn(),
  seekFromS3: () => Promise.resolve(null),
}));

jest.mock('next/dynamic', () => () => () => 'Sup Im a heatmap');

// // Worker responses are fetched from S3, so these endpoints are added to fetchMock
// // the URL for the endpoints are generated by the functions passed to mockETag above
const mockWorkerResponses = {
  '5-marker-genes': () => Promise.resolve(_.cloneDeep(markerGenesData5)),
  '2-marker-genes': () => Promise.resolve(_.cloneDeep(markerGenesData2)),
};

let storeState = null;
const loadAndRenderDefaultHeatmap = async () => {
  storeState = makeStore();

  storeState.dispatch(loadProcessingSettings(experimentId));
  storeState.dispatch(loadBackendStatus(experimentId));

  await act(async () => {
    render(
      <Provider store={storeState}>
        <HeatmapPlot
          experimentId={experimentId}
          width={50}
          height={50}
        />
      </Provider>,
    );
  });
};

const stalledResponse = () => new Promise(() => { });
const errorResponse = () => Promise.reject(new Error('Some error idk'));

describe('HeatmapPlot', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();

    seekFromAPI.mockClear();
  });

  it('Renders the heatmap component by default if everything loads', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    seekFromAPI.mockImplementation((a, b, c, requested) => mockWorkerResponses[requested]());

    await loadAndRenderDefaultHeatmap();

    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();
  });

  it('Shows loader message if cellSets are loading', async () => {
    const mockAPIResponses = _.merge(
      generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID),
      { [`experiments/${experimentId}/cellSets`]: stalledResponse },
    );

    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    await loadAndRenderDefaultHeatmap();

    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loading', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    const customWorkerResponses = _.merge(
      _.cloneDeep(mockWorkerResponses),
      { '5-marker-genes': stalledResponse },
    );

    seekFromAPI.mockImplementation((a, b, c, requested) => customWorkerResponses[requested]());

    await loadAndRenderDefaultHeatmap();

    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loaded but there\'s other selected genes still loading', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    const customWorkerResponses = _.merge(
      _.cloneDeep(mockWorkerResponses),
      { 'loading_gene_id-expression': stalledResponse },
    );

    seekFromAPI.mockImplementation((a, b, c, requested) => customWorkerResponses[requested]());

    await loadAndRenderDefaultHeatmap();

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If a new gene suddenly is suddenly selected
    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, [...markerGenesData5.order, 'loading_gene_id'], 'interactiveHeatmap'));
    });

    // Loading screen shows up
    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Handles marker genes loading error correctly', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    const customWorkerResponses = _.merge(
      _.cloneDeep(mockWorkerResponses),
      { '5-marker-genes': errorResponse },
    );

    seekFromAPI.mockImplementation((a, b, c, requested) => customWorkerResponses[requested]());

    await loadAndRenderDefaultHeatmap();

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Handles expression data loading error correctly', async () => {
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    const customWorkerResponses = _.merge(
      _.cloneDeep(mockWorkerResponses),
      { 'loading_gene_id-expression': errorResponse },
    );

    seekFromAPI.mockImplementation((a, b, c, requested) => customWorkerResponses[requested]());

    await loadAndRenderDefaultHeatmap();

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If a new gene suddenly is suddenly selected
    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, [...markerGenesData5.order, 'loading_gene_id'], 'interactiveHeatmap'));
    });

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  // Think more tests
});
