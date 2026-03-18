import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const PemDawnsawn = () => {
  const columns = ['Hming', 'Pem Ni', 'Kohhran atangin', 'Kohhran-ah', 'A chhan'];
  const schema = {
    name: 'Hming',
    date: 'Pem Ni',
    fromChurch: 'Kohhran atangin',
    toChurch: 'Kohhran-ah',
    reason: 'A chhan'
  };

  return (
    <RecordTable 
      title="Pem Dawnsawn" 
      description="Hmun dang atanga kan kohhran-a pem lut tharte record vawn thatna."
      columns={columns}
      collectionName="transfer_records"
      schema={schema}
    />
  );
};

export default PemDawnsawn;
