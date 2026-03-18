import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const PawlDang = () => {
  const columns = ['Name', 'Date Joined', 'Former Denomination', 'Admission Type', 'Officiant'];
  const schema = {
    name: 'Name',
    date: 'Date Joined',
    formerDenomination: 'Former Denomination',
    admissionType: 'Admission Type',
    officiant: 'Officiant'
  };

  return (
    <RecordTable 
      title="Pawl Dang atanga lo lut" 
      description="Members joining us from other denominations, growing our family through diverse spiritual backgrounds."
      columns={columns}
      collectionName="admission_records"
      schema={schema}
    />
  );
};

export default PawlDang;
