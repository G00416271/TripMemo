import NavBar from '../NavBar.jsx';
import Canvas from '../canvas1.jsx';
import Tools from '../toolbox/toolbar.jsx';
import BottomDrawer from '../toolbox/assetStore.jsx';
import { useState } from "react";
import React from "react";
import "./Create.css"



document.oncontextmenu = () => false;


export default function Create({ serverData, setActiveTab, memoryId, memoryName }) {

  const [page, setPage] = useState("main");


  return (
    <>
        <div className="create-layout">
          <div id="navbar">
            <NavBar setActiveTab={setActiveTab}/>
          </div>
          
          {/* toolbar on the left */}
          <Tools/> 


          {/* main screen */}
          <div id="canvas-wrapper">
            <Canvas memoryId={memoryId} memoryName={memoryName}/>
          </div>


          {/* where images from the tags are stored */}
           <div>
            <BottomDrawer serverData={serverData}/>
          </div>
        </div>
    </>
  );
}