/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from './initialState';

const backendStatusLoaded = produce((draft, action) => {
  const { experimentId, status } = action.payload;

  const previousStatus = current(draft)[experimentId]?.status;
  const newStatus = {
    pipeline: status.pipeline ?? previousStatus?.pipeline,
    gem2s: status.gem2s ?? previousStatus?.gem2s,
    worker: status.worker ?? previousStatus?.worker,
  };
  console.log('NEW STATUS IS ', newStatus.gem2s);

  draft[experimentId] = {
    status: newStatus,
    loading: false,
    error: false,
  };
}, initialState);

export default backendStatusLoaded;
