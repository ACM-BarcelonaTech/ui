/* eslint-disable import/no-unresolved */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Table, Row, Col } from 'antd';
import { DEFAULT_NA } from 'redux/reducers/projects/initialState';
import { updateExperiment } from 'redux/actions/experiments';
import { updateProject } from 'redux/actions/projects';
import arrayMove from 'array-move';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import UploadStatus from 'utils/data-management/UploadStatus';

const SamplesTable = (props) => {
  const { tableColumns, activeProjectUuid, height } = props;
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;

  useEffect(() => {
    if (!activeProject || !samples[activeProject.samples[0]]) {
      setTableData([]);
      return;
    }

    // Set table data

    const newData = activeProject.samples.map((sampleUuid, idx) => {
      const sampleFiles = samples[sampleUuid].files;

      const barcodesFile = sampleFiles['barcodes.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const genesFile = sampleFiles['features.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const matrixFile = sampleFiles['matrix.mtx.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };

      const barcodesData = { sampleUuid, file: barcodesFile };
      const genesData = { sampleUuid, file: genesFile };
      const matrixData = { sampleUuid, file: matrixFile };

      return {
        key: idx,
        name: samples[sampleUuid].name,
        uuid: sampleUuid,
        barcodes: barcodesData,
        genes: genesData,
        matrix: matrixData,
        species: samples[sampleUuid].species || DEFAULT_NA,
        ...samples[sampleUuid].metadata,
      };
    });
    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);
  const SortableRow = sortableElement((otherProps) => <tr {...otherProps} className={`${otherProps.className} drag-visible`} />);
  const SortableTable = sortableContainer((otherProps) => <tbody {...otherProps} />);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      // This can be done because there is only one experiment per project
      // Has to be changed when we support multiple experiments per project
      const experimentId = activeProject.experiments[0];

      const newData = arrayMove([].concat(tableData), oldIndex, newIndex).filter((el) => !!el);
      const newSampleOrder = newData.map((sample) => sample.uuid);

      dispatch(updateProject(activeProjectUuid, { samples: newSampleOrder }));
      dispatch(updateExperiment(experimentId, { sampleIds: newSampleOrder }));
      setTableData(newData);
    }
  };

  const DragContainer = (otherProps) => (
    <SortableTable
      useDragHandle
      disableAutoscroll
      helperClass='row-dragging'
      onSortEnd={onSortEnd}
      {...otherProps}
    />
  );

  const DraggableRow = (otherProps) => {
    // eslint-disable-next-line react/prop-types
    const index = tableData.findIndex((x) => x.key === props['data-row-key']);
    return <SortableRow index={index} {...otherProps} />;
  };

  return (
    <Row>
      <Col>
        <Table
          size='small'
          scroll={{
            x: 'max-content',
            y: height - 250,
          }}
          bordered
          columns={tableColumns}
          dataSource={tableData}
          sticky
          pagination={false}
          components={{
            body: {
              wrapper: DragContainer,
              row: DraggableRow,
            },
          }}
        />
      </Col>
    </Row>
  );
};

SamplesTable.propTypes = {
  height: PropTypes.number.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
  tableColumns: PropTypes.array.isRequired,
};

export default SamplesTable;
