import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Minutes = () => {
  const columns = ['Meeting Type', 'Date', 'Secretary', 'Key Decisions', 'Download'];
  const schema = {
    meetingType: 'Meeting Type',
    date: 'Date',
    secretary: 'Secretary',
    decisions: 'Key Decisions',
    downloadUrl: 'Download'
  };

  return (
    <RecordTable 
      title="Meeting Minutes" 
      description="Official records and minutes from various church committee meetings and general assemblies."
      columns={columns}
      collectionName="minute_records"
      schema={schema}
    />
  );
};

export default Minutes;
