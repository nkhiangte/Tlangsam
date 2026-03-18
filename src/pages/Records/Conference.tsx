import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Conference = () => {
  const columns = ['Conference Name', 'Date', 'Location', 'Delegates', 'Report Link'];
  const schema = {
    name: 'Conference Name',
    date: 'Date',
    location: 'Location',
    delegates: 'Delegates',
    reportUrl: 'Report Link'
  };

  return (
    <RecordTable 
      title="Conference Records" 
      description="Minutes and reports from various church conferences and meetings, documenting our collective decisions and progress."
      columns={columns}
      collectionName="conference_records"
      schema={schema}
    />
  );
};

export default Conference;
