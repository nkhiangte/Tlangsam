import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Baptism = () => {
  const columns = ['Hming', 'Baptisma Ni', 'Nu leh Pa', 'Baptisma petu', 'Hmun'];
  const schema = {
    name: 'Hming',
    date: 'Baptisma Ni',
    parents: 'Nu leh Pa',
    officiant: 'Baptisma petu',
    location: 'Hmun'
  };

  return (
    <RecordTable 
      title="Baptisma Record-te" 
      description="Tlangsam Presbyterian Kohhran-a baptisma chang tawh zawng zawngte record vawn thatna."
      columns={columns}
      collectionName="baptism_records"
      schema={schema}
    />
  );
};

export default Baptism;
