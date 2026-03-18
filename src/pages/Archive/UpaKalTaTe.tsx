import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const UpaKalTaTe = () => {
  const columns = ['Hming', 'Upa thlan ni', 'Rawngbawl kum', 'Thih ni', 'Hriatrengna'];
  const schema = {
    name: 'Hming',
    ordinationDate: 'Upa thlan ni',
    yearsOfService: 'Rawngbawl kum',
    deathDate: 'Thih ni',
    legacy: 'Hriatrengna'
  };

  return (
    <RecordTable 
      title="Upa kal ta te" 
      description="Tlangsam Presbyterian Kohhran-a Upa lo ni tawh, chawl tawhte hriatrengna leh record."
      columns={columns}
      collectionName="elder_records"
      schema={schema}
    />
  );
};

export default UpaKalTaTe;
