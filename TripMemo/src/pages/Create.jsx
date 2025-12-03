import NavBar from '../NavBar.jsx';
import Canvas from '../canvas1.jsx';
import Tools from '../toolbox/toolbar.jsx';
import TestDBButton from "../components/testDBbutton.jsx";
import BottomDrawer from '../toolbox/assetStore.jsx';
import TestGemini from '../test.jsx';    
import { useState } from "react";
import React from "react";



document.oncontextmenu = () => false;


export default function Create({ serverData, setActiveTab }) {
  const [page, setPage] = useState("main");


  return (
    <>
      {/* simple switch button
      <button 
        onClick={() => setPage(page === "main" ? "second" : "main")}
        style={{ position: "absolute", top: 90, left: 10, zIndex: 99999 }}
      >
        Switch Page
      </button> */}

        <>
          <div id="navbar">
            <NavBar setActiveTab={setActiveTab}/>
          </div>

          <div style={{ 
            display: "flex", 
            zIndex: 99999, 
            position: "absolute", 
            top: 10, 
            right: 10, 
            background: "white", 
            padding: 10, 
            borderRadius: 8, 
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)" 
          }}>
            <TestDBButton />
          </div>

          <Tools />

          <div style={{ display: "flex" }}>
            <BottomDrawer serverData={serverData}/>
          </div>

          <div id="canvas-container">
            <Canvas />
          </div>
        </>
    </>
  );
}