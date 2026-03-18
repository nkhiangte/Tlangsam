import React from 'react';
import { RecordTable } from '../../components/RecordTable';

const PemDawnsawn = () => {
  const columns = ['Name', 'Date of Transfer', 'From Church', 'To Church', 'Reason'];
  const schema = {
    name: 'Name',
    date: 'Date of Transfer',
    fromChurch: 'From Church',
    toChurch: 'To Church',
    reason: 'Reason'
  };

  return (
    <RecordTable 
      title="Pem Dawnsawn (Transfer In)" 
      description="Records of members who have transferred their membership to Tlangsam, welcoming them into our local fold."
      columns={columns}
      collectionName="transfer_records"
      schema={schema}
    />
  );
};

export default PemDawnsawn;
