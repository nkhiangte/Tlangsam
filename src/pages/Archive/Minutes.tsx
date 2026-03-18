import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Minutes = () => {
  const columns = ['Inkhawm/Meeting', 'Ni', 'Secretary', 'Thutlukna pawimawh', 'Download'];
  const schema = {
    meetingType: 'Inkhawm/Meeting',
    date: 'Ni',
    secretary: 'Secretary',
    decisions: 'Thutlukna pawimawh',
    downloadUrl: 'Download'
  };

  return (
    <RecordTable 
      title="Meeting Minutes-te" 
      description="Kohhran committee leh inkhawmpui hrang hrang minutes vawn thatna."
      columns={columns}
      collectionName="minute_records"
      schema={schema}
    />
  );
};

export default Minutes;
