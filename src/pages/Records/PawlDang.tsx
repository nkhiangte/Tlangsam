import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const PawlDang = () => {
  const columns = ['Hming', 'Luh Ni', 'Pawl hman', 'Luh dan', 'Latu'];
  const schema = {
    name: 'Hming',
    date: 'Luh Ni',
    formerDenomination: 'Pawl hman',
    admissionType: 'Luh dan',
    officiant: 'Latu'
  };

  return (
    <RecordTable 
      title="Pawl Dang atanga lo lut" 
      description="Pawl dang atanga kan kohhran-a lo lut tharte record vawn thatna."
      columns={columns}
      collectionName="admission_records"
      schema={schema}
    />
  );
};

export default PawlDang;
