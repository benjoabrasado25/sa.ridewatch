import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SchoolsManagementLayer from "../components/SchoolsManagementLayer";

const SchoolsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Schools Management" />
      <SchoolsManagementLayer />
    </MasterLayout>
  );
};

export default SchoolsPage;
