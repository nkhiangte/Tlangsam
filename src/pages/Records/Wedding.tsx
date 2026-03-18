import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Wedding = () => {
  const columns = ['Groom Name', 'Bride Name', 'Date of Marriage', 'Officiant', 'Witnesses'];
  const schema = {
    groom: 'Groom Name',
    bride: 'Bride Name',
    date: 'Date of Marriage',
    officiant: 'Officiant',
    witnesses: 'Witnesses'
  };

  return (
    <RecordTable 
      title="Wedding Records" 
      description="Sacred unions blessed and recorded in our church registry, celebrating the covenant of marriage."
      columns={columns}
      collectionName="wedding_records"
      schema={schema}
    />
  );
};

export default Wedding;
