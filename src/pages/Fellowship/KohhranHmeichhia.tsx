import React from 'react';
import FellowshipPage from './FellowshipPage';

const KohhranHmeichhia = () => {
  return (
    <FellowshipPage 
      id="kohhran-hmeichhia"
      label="Kohhran Hmeichhia"
      defaultName="Kohhran Hmeichhia"
      defaultDescription="Tlangsam Presbyterian Kohhran-a hmeichhiate rinna, rawngbawlna leh inpawlhona kawnga thuam chakna."
      defaultPurpose="Kohhran Hmeichhia hi kan kohhran-a pawl pawimawh tak a ni. Thlarau lama hmasawnna, kohhran hna hrang hrang thlawpna leh mamawhtute tana rawngbawlna kawngah kan thawk thin a ni."
      defaultImageUrl=""
      defaultMeetingTime="Thawhlehni zan dar 6:30-ah Biak In Hall-ah."
      defaultActivities={[
        "Mamawhtute tana thilpek leh rawngbawlna.",
        "Thla tin Pathian thu zirhona neih thin a ni.",
        "Damlo tlawh leh tanpui ngaite tanpuina."
      ]}
      thiltumte={[
        "Kohhran pum rawngbâwlna tihlawhtling tûra thawh ho.",
        "Kristian chhûngkua din nghehtîr tûra tan lâk.",
        "Tanpui ngaite Krista hminga tanpui",
        "Chanchin tha puan darh."
      ]}
      thuvawn={{
        text: "THUHRETU ATÂNA KOH",
        reference: "“Ka thuhretute in ni ang” (Tirh 1:8)"
      }}
    />
  );
};

export default KohhranHmeichhia;
