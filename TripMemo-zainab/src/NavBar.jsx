import React from "react";

function NavBar({setActiveTab}) {
  return (
    <h1 className="fixed top-0 w-full z-50 bg-blue-200 m-0 p-2"
      onClick={() => setActiveTab("create")}
    >
      🠔
    </h1>
  );
}

export default NavBar;
