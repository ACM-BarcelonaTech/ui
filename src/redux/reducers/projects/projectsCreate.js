const projectsCreate = (state, action) => {
  const { project } = action.payload;
  return {
    ...state,
    ids: [...state.ids, project.uuid],
    meta: {
      ...state.meta,
      activeProjectUuid: project.uuid,
      saving: false,
    },
    [project.uuid]: project,
  };
};

export default projectsCreate;
