import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CreateSchoolLayer from "../components/CreateSchoolLayer";

const CreateSchoolPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Create School" />
      <CreateSchoolLayer />
    </MasterLayout>
  );
};

export default CreateSchoolPage;
