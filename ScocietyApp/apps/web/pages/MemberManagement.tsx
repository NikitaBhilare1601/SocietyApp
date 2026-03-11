import React from 'react';
import { Button } from "@shadcn/ui";

const MemberManagement = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Member Management</h1>
      <Button>Add New Member</Button>
      {/* Add table and other components here */}
    </div>
  );
};

export default MemberManagement;