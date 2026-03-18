import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Wedding = () => {
  const columns = ['Mipa Hming', 'Hmeichhe Hming', 'Inneih Ni', 'Inneitirtu', 'Hrechiangtute'];
  const schema = {
    groom: 'Mipa Hming',
    bride: 'Hmeichhe Hming',
    date: 'Inneih Ni',
    officiant: 'Inneitirtu',
    witnesses: 'Hrechiangtute'
  };

  return (
    <RecordTable 
      title="Inneihna Record-te" 
      description="Kan kohhran-a innei tawh zawng zawngte record vawn thatna."
      columns={columns}
      collectionName="wedding_records"
      schema={schema}
    />
  );
};

export default Wedding;
