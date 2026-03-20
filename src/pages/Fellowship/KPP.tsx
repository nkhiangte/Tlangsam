import React from 'react';
import FellowshipPage from './FellowshipPage';

const KPP = () => {
  return (
    <FellowshipPage 
      id="kpp"
      label="KPP"
      defaultName="Kohhran Pa Pawl (KPP)"
      defaultDescription="Tlangsam Presbyterian Kohhran pa-te rinna leh hruaitu nihna kawnga thuam chakna."
      defaultPurpose="KPP hi kan kohhran pa-te tana thlarau lama hmasawnna leh inpawlhona hmun pawimawh tak a ni. Kristian hruaitu tha tak nih leh, kohhran hna hrang hrang thlawp leh inunauna tha zawk siam kan tum a ni."
      defaultImageUrl=""
      defaultMeetingTime="Thla tin Inrinni hmasa ber zan dar 6:00-ah."
      defaultActivities={[
        "Kohhran hruaitu tha ni tura inbuatsaihna.",
        "Kristian pa-te mawhphurhna leh hruaitu nihna zirhona.",
        "Biak In enkawl leh hmun hrang hranga rawngbawlna."
      ]}
      thiltumte={[
        "Mi dangte Krista hnena hruai.",
        "Kohhran hmalakna tawiawm.",
        "Kristian chhungkaw tha din tura tan lak."
      ]}
      thuvawn={{
        text: "Krista tana nun",
        reference: "Philipi 1:21"
      }}
    />
  );
};

export default KPP;
