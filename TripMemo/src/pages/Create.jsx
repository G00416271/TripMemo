import NavBar from "../NavBar.jsx";
import Canvas from "../canvas1.jsx";
import Tools from "../toolbox/toolbar.jsx";
import BottomDrawer from "../toolbox/assetStore.jsx";
import { useState } from "react";
import React from "react";
import "./Create.css";


document.oncontextmenu = () => false;

export default function Create({
  serverData,
  setActiveTab,
  memoryId,
  memoryName,
  uploadedFiles,
  setUploadedFiles,
}) {
  const [page, setPage] = useState("main");
  const [tags, setTags] = useState([]);

  return (
    <>
      <div className="create-layout">
        <div id="navbar">
          <NavBar setActiveTab={setActiveTab} />
        </div>

        {/* toolbar on the left */}
        <Tools setActiveTab={setActiveTab} />

        {/* main screen */}
        <div id="canvas-wrapper">
          <Canvas
            memoryId={memoryId}
            memoryName={memoryName}
            setActiveTab={setActiveTab}
            uploadedFiles={uploadedFiles}
            serverData={serverData}
            setUploadedFiles={setUploadedFiles} 
            setMemoryTags={setTags}
          />
        </div>

        {/* where images from the tags are stored */}
        <div>
          <BottomDrawer serverData={serverData} memoryTags={tags} />
        </div>
      </div>
    </>
  );
}
