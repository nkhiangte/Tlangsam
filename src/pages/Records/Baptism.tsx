import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Baptism = () => {
  const columns = ['Name', 'Date of Baptism', 'Parents', 'Officiant', 'Location'];
  const schema = {
    name: 'Name',
    date: 'Date of Baptism',
    parents: 'Parents',
    officiant: 'Officiant',
    location: 'Location'
  };

  return (
    <RecordTable 
      title="Baptism Records" 
      description="Official registry of holy baptism administered at Tlangsam Presbyterian Kohhran, documenting the spiritual journey of our members."
      columns={columns}
      collectionName="baptism_records"
      schema={schema}
    />
  );
};

export default Baptism;
