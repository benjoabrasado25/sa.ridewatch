import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import InviteDriverLayer from "../components/InviteDriverLayer";




const InviteDriverPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Components / Image Upload" />

        {/* InviteDriverLayer */}
        <InviteDriverLayer />

      </MasterLayout>

    </>
  );
};

export default InviteDriverPage;
