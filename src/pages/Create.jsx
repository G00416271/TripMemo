import NavBar from "../NavBar.jsx";
import Canvas from "../canvas1.jsx";
import Tools from "../toolbox/toolbar.jsx";
import BottomDrawer from "../toolbox/assetStore.jsx";
import BackgroundPicker, {
  BackgroundOverlay,
} from "../toolbox/BackgroundPicker.jsx";
import { useState, useEffect, useRef } from "react";

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
  avatarUrl,
}) {
  const [page, setPage] = useState("main");
  const [tags, setTags] = useState([]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgPattern, setBgPattern] = useState("blank");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [tool, setTool] = useState("selection");

  const saveRef = useRef(null);

  // Close picker when clicking outside of it
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!showBgPicker) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        if (e.target.closest?.("#bg-fab")) return;
        setShowBgPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBgPicker]);

  useEffect(() => {
    setTags([]);
  }, [memoryId]);

  return (
    <>
      <div
        className="create-layout"
        style={{ background: bgColor, position: "relative" }}
      >
        {/* Pattern overlay — behind everything, pointer-events: none */}
        <BackgroundOverlay
          pattern={bgPattern}
          bgColor={bgColor}
          width={window.innerWidth}
          height={window.innerHeight}
        />

        {/* Navbar — receives live bgColor so it tints to match */}
        <div id="navbar">
          <NavBar
            setActiveTab={setActiveTab}
            avatarUrl={avatarUrl}
            bgColor={bgColor}
            memoryName={memoryName}
            onSave={() => saveRef.current?.()}
            onCanvas={true}
          />
        </div>

        {/* toolbar on the left */}
        <Tools
          tool={tool}
          setTool={setTool}
          onSave={() => {
            saveRef.current?.();
          }}
          setActiveTab={setActiveTab}
        />

        {/* main canvas */}
        <div
          id="canvas-wrapper"
          style={{
            padding: "16px 16px 100px 16px",
            boxSizing: "border-box",
          }}
        >
          <Canvas
            memoryId={memoryId}
            memoryName={memoryName}
            setActiveTab={setActiveTab}
            uploadedFiles={uploadedFiles}
            serverData={serverData}
            setUploadedFiles={setUploadedFiles}
            setMemoryTags={setTags}
            saveRef={saveRef}
            bgColor={bgColor}
            bgPattern={bgPattern}
            onBgChange={({ bgColor, bgPattern }) => {
              setBgColor(bgColor);
              setBgPattern(bgPattern);
            }}
            tool={tool}
            setTool={setTool}
          />
        </div>

        {/* asset drawer */}
        <div>
          <BottomDrawer serverData={serverData} memoryTags={tags} />
        </div>

        {/* ── Background picker FAB + panel ── */}
        <button
          id="bg-fab"
          onClick={() => setShowBgPicker((v) => !v)}
          title="Background & Pattern"
          style={{
            position: "fixed",
            bottom: 80,
            left: 24,
            zIndex: 2000,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: bgColor,
            border: "3px solid white",
            boxShadow: "0 3px 12px rgba(0,0,0,0.28)",
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🎨
        </button>

        {showBgPicker && (
          <div
            ref={pickerRef}
            style={{
              position: "fixed",
              bottom: 136,
              left: 24,
              zIndex: 2001,
            }}
          >
            <BackgroundPicker
              bgColor={bgColor}
              pattern={bgPattern}
              onChange={({ bgColor: c, pattern: p }) => {
                setBgColor(c);
                setBgPattern(p);
              }}
              onClose={() => setShowBgPicker(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}