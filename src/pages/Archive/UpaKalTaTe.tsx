import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const UpaKalTaTe = () => {
  const columns = ['Name', 'Ordination Date', 'Years of Service', 'Date of Decease', 'Legacy'];
  const schema = {
    name: 'Name',
    ordinationDate: 'Ordination Date',
    yearsOfService: 'Years of Service',
    deathDate: 'Date of Decease',
    legacy: 'Legacy'
  };

  return (
    <RecordTable 
      title="Upa kal ta te (Deceased Elders)" 
      description="Honoring the memory and service of the elders who have served Tlangsam Presbyterian Kohhran faithfully."
      columns={columns}
      collectionName="elder_records"
      schema={schema}
    />
  );
};

export default UpaKalTaTe;
