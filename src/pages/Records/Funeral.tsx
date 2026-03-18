import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Funeral = () => {
  const columns = ['Name', 'Date of Death', 'Date of Funeral', 'Age', 'Officiant'];
  const schema = {
    name: 'Name',
    deathDate: 'Date of Death',
    funeralDate: 'Date of Funeral',
    age: 'Age',
    officiant: 'Officiant'
  };

  return (
    <RecordTable 
      title="Funeral Records" 
      description="Honoring the lives of our members who have gone to be with the Lord, preserving their memory in our community."
      columns={columns}
      collectionName="funeral_records"
      schema={schema}
    />
  );
};

export default Funeral;
