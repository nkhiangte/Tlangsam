import React from 'react';
import { RecordTable } from '../../components/RecordTable';

export const WeeklyReportPage: React.FC = () => {
  const columns = ['Ni (Date)', 'Attendance', 'Thawhlawm (Collection)', 'Remarks'];
  const schema = {
    date: 'Ni (Date)',
    attendance: 'Attendance',
    collection: 'Thawhlawm (Collection)',
    remarks: 'Remarks'
  };

  return (
    <RecordTable 
      title="Sunday School Weekly Report"
      description="Sunday School attendance leh thawhlawm report-te tarlan a ni."
      columns={columns}
      collectionName="sunday_school_reports"
      schema={schema}
    />
  );
};
