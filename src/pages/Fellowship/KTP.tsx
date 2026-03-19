import React from 'react';
import FellowshipPage from './FellowshipPage';

const KTP = () => {
  return (
    <FellowshipPage 
      id="ktp"
      defaultName="Kristian Thalai Pawl (KTP)"
      defaultDescription="Tlangsam Presbyterian Kohhran thalaite inpawlhona leh thlarau lama hmasawnna tura din."
      defaultPurpose="KTP hi kan kohhran thalaite tana thlarau lama hmasawnna leh rawngbawlna hmun pawimawh tak a ni. Thalaite rinna kawnga chawm len leh, rawngbawlna hrang hrangah an theihna hman thiamtir kan tum a ni."
      defaultImageUrl=""
      defaultMeetingTime="Thawhtanni zan dar 7:00-ah Biak In Hall-ah."
      defaultActivities={[
        "Praise & Worship leh zai hruaina.",
        "Thalaite hnena Chanchin Tha hril.",
        "Thla tin group hrang hrangah inpawlhona neih thin a ni."
      ]}
    />
  );
};

export default KTP;
