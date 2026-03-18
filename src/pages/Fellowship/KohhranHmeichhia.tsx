import React from 'react';
import FellowshipPage from './FellowshipPage';

const KohhranHmeichhia = () => {
  return (
    <FellowshipPage 
      id="kohhran-hmeichhia"
      defaultName="Kohhran Hmeichhia"
      defaultDescription="Tlangsam Presbyterian Kohhran-a hmeichhiate rinna, rawngbawlna leh inpawlhona kawnga thuam chakna."
      defaultPurpose="Kohhran Hmeichhia hi kan kohhran-a pawl pawimawh tak a ni. Thlarau lama hmasawnna, kohhran hna hrang hrang thlawpna leh mamawhtute tana rawngbawlna kawngah kan thawk thin a ni."
      defaultImageUrl="https://picsum.photos/seed/women-fellowship/800/600"
      defaultMeetingTime="Thawhlehni zan dar 6:30-ah Biak In Hall-ah."
      defaultActivities={[
        "Mamawhtute tana thilpek leh rawngbawlna.",
        "Thla tin Pathian thu zirhona neih thin a ni.",
        "Damlo tlawh leh tanpui ngaite tanpuina."
      ]}
    />
  );
};

export default KohhranHmeichhia;
