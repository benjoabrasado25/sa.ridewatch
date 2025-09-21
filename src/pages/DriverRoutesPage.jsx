import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DriverRoutesLayer from "../components/DriverRoutesLayer";

const DriverRoutesPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Components / Routes" />
      <DriverRoutesLayer />
    </MasterLayout>
  );
};

export default DriverRoutesPage;
