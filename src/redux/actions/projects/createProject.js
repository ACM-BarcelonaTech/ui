import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';

import {
  PROJECTS_ERROR,
  PROJECTS_CREATE,
  PROJECTS_SAVING,
} from '../../actionTypes/projects';

import { projectTemplate } from '../../reducers/projects/initialState';
import createExperiment from '../experiments/createExperiment';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const createProject = (
  projectName,
  projectDescription,
  newExperimentName,
) => async (dispatch) => {
  const createdDate = moment().toISOString();

  const newProjectUuid = uuidv4();

  // Always create an experiment for a new project
  // required because samples DynamoDB require experimentId
  const newExperiment = await dispatch(createExperiment(newProjectUuid, newExperimentName));

  dispatch({
    type: PROJECTS_SAVING,
    payload: {
      message: endUserMessages.SAVING_PROJECT,
    },
  });

  const newProject = {
    ...projectTemplate,
    name: projectName,
    description: projectDescription,
    uuid: newProjectUuid,
    experiments: [newExperiment.id],
    createdDate,
    lastModified: createdDate,
  };

  try {
    const url = `/v1/projects/${newProjectUuid}`;
    try {
      const response = await fetchAPI(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProject),
        },
      );

      const json = await response.json();

      throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);
    } catch (e) {
      let { message } = e;

      if (!isServerError(e)) {
        console.error(`fetch ${url} error ${message}`);
        message = endUserMessages.ERROR_SAVING;
      }

      dispatch({
        type: PROJECTS_ERROR,
        payload: {
          error: message,
        },
      });

      pushNotificationMessage('error', message);
      return Promise.reject(message);
    }

    dispatch({
      type: PROJECTS_CREATE,
      payload: { project: newProject },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default createProject;
