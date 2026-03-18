import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Conference = () => {
  const columns = ['Inkhawmpui Hming', 'Ni', 'Hmun', 'Palai zat', 'Report Link'];
  const schema = {
    name: 'Inkhawmpui Hming',
    date: 'Ni',
    location: 'Hmun',
    delegates: 'Palai zat',
    reportUrl: 'Report Link'
  };

  return (
    <RecordTable 
      title="Inkhawmpui Record-te" 
      description="Kohhran inkhawmpui hrang hrang minutes leh report-te vawn thatna."
      columns={columns}
      collectionName="conference_records"
      schema={schema}
    />
  );
};

export default Conference;
