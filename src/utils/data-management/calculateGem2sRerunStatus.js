import pipelineStatus from 'utils/pipelineStatusValues';
import generateGem2sParamsHash from './generateGem2sParamsHash';

const calculateGem2sRerunStatus = (gem2sBackendStatus, activeProject, samples, experiment) => {
  const { status: gem2sStatus, paramsHash: existingParamsHash } = gem2sBackendStatus;

  const newParamsHash = generateGem2sParamsHash(
    activeProject,
    samples,
    experiment,
  );

  const projectHashEqual = existingParamsHash === newParamsHash;

  const gem2sSuccessful = [
    pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
  ].includes(gem2sStatus);

  const rerunReasons = [];
  if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
  if (!projectHashEqual) rerunReasons.push('the project samples/metadata have been modified');

  return ({
    rerun: !gem2sSuccessful || !projectHashEqual,
    paramsHash: newParamsHash,
    reasons: rerunReasons,
  });
};

export default calculateGem2sRerunStatus;
