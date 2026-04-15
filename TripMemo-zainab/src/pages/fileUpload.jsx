import NavBar from "../NavBar.jsx";
import UploadFiles from "../uploadFiles.jsx";
import { useState } from "react";

document.oncontextmenu = () => false;

export default function FileUpload() {
  const [page, setPage] = useState("main");

  return (
    <>
      <>
        <div id="navbar" style={{ display: "flex", padding: 0 }}>
          <NavBar />
          <div style={{display: "flex" , padding: 10}}>
            <UploadFiles />
          </div>
        </div>
      </>
    </>
  );
}
