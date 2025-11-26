import { useState, useEffect, useRef } from "react";
import Tools from "";
import SizeBadge from "";
import Canvas1 from ""; // your canvas component

function App() {

  // --- GLOBAL STATES ---
  const [tool, setTool] = useState("selection");
  const [scale, setScale] = useState(1);     // <--- SCALE NOW LIVES HERE
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  return (
    <div>

      {/* TOOLBAR */}
      <Tools tool={tool} setTool={setTool} />

      {/* ZOOM BADGE */}
      <SizeBadge scale={scale} />

      {/* CANVAS (receives and updates scale) */}
      <Canvas1 
        tool={tool}
        scale={scale}
        setScale={setScale}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
      />

    </div>
  );
}

export default App;
