import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const Funeral = () => {
  const columns = ['Hming', 'Thih Ni', 'Phum Ni', 'Kum', 'Phumtu'];
  const schema = {
    name: 'Hming',
    deathDate: 'Thih Ni',
    funeralDate: 'Phum Ni',
    age: 'Kum',
    officiant: 'Phumtu'
  };

  return (
    <RecordTable 
      title="Mitthi Record-te" 
      description="Lalpa hnena chawl tawh kan kohhran member-te hriatrengna leh record vawn thatna."
      columns={columns}
      collectionName="funeral_records"
      schema={schema}
    />
  );
};

export default Funeral;
