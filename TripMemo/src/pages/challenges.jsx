import { useState, useRef, useCallback, useEffect } from "react";

// ─── Challenge data ───────────────────────────────────────────────────────────
const CHALLENGES = [
{
  city: "Rome", country: "Italy", emoji: "🇮🇹",
  tasks: [
    { id: "rome_colosseum", label: "Take a picture of the Colosseum", clipHint: "a photo of the Colosseum in Rome" },
    { id: "rome_trevi",     label: "Take a picture of the Trevi Fountain", clipHint: "a photo of the Trevi Fountain in Rome" },
  ],
},
{
  city: "New York", country: "USA", emoji: "🇺🇸",
  tasks: [
    { id: "ny_statue", label: "Take a picture of the Statue of Liberty", clipHint: "a photo of the Statue of Liberty in New York" },
    { id: "ny_times",  label: "Take a picture of Times Square", clipHint: "a photo of Times Square in New York at night" },
  ],
},
{
  city: "Tokyo", country: "Japan", emoji: "🇯🇵",
  tasks: [
    { id: "tokyo_crossing", label: "Take a picture of Shibuya Crossing", clipHint: "a photo of Shibuya Crossing in Tokyo" },
    { id: "tokyo_tower",    label: "Take a picture of Tokyo Tower", clipHint: "a photo of Tokyo Tower in Tokyo" },
  ],
},
{
  city: "Barcelona", country: "Spain", emoji: "🇪🇸",
  tasks: [
    { id: "barcelona_sagrada", label: "Take a picture of Sagrada Familia", clipHint: "a photo of Sagrada Familia in Barcelona" },
    { id: "barcelona_beach",   label: "Take a picture at the beach", clipHint: "a photo of Barceloneta beach in Barcelona" },
  ],
},
{
  city: "Dubai", country: "UAE", emoji: "🇦🇪",
  tasks: [
    { id: "dubai_burj", label: "Take a picture of Burj Khalifa", clipHint: "a photo of Burj Khalifa in Dubai" },
    { id: "dubai_desert", label: "Take a picture in the desert", clipHint: "a photo of desert dunes in Dubai" },
  ],
},
{
  city: "Sydney", country: "Australia", emoji: "🇦🇺",
  tasks: [
    { id: "sydney_opera", label: "Take a picture of the Sydney Opera House", clipHint: "a photo of Sydney Opera House" },
    { id: "sydney_bridge", label: "Take a picture of the Harbour Bridge", clipHint: "a photo of Sydney Harbour Bridge" },
  ],
},
{
  city: "Cape Town", country: "South Africa", emoji: "🇿🇦",
  tasks: [
    { id: "capetown_table", label: "Take a picture of Table Mountain", clipHint: "a photo of Table Mountain in Cape Town" },
    { id: "capetown_beach", label: "Take a picture of the coastline", clipHint: "a photo of Cape Town coastline" },
  ],
},
{
  city: "Amsterdam", country: "Netherlands", emoji: "🇳🇱",
  tasks: [
    { id: "amsterdam_canal", label: "Take a picture of the canals", clipHint: "a photo of canals in Amsterdam" },
    { id: "amsterdam_bike", label: "Take a picture of a bicycle", clipHint: "a photo of bicycles in Amsterdam" },
  ],
},
{
  city: "Berlin", country: "Germany", emoji: "🇩🇪",
  tasks: [
    { id: "berlin_gate", label: "Take a picture of Brandenburg Gate", clipHint: "a photo of Brandenburg Gate in Berlin" },
    { id: "berlin_wall", label: "Take a picture of the Berlin Wall", clipHint: "a photo of Berlin Wall graffiti" },
  ],
},
{
  city: "Rio de Janeiro", country: "Brazil", emoji: "🇧🇷",
  tasks: [
    { id: "rio_christ", label: "Take a picture of Christ the Redeemer", clipHint: "a photo of Christ the Redeemer statue" },
    { id: "rio_beach", label: "Take a picture of Copacabana Beach", clipHint: "a photo of Copacabana beach in Rio" },
  ],
},
{
  city: "Reykjavik", country: "Iceland", emoji: "🇮🇸",
  tasks: [
    { id: "iceland_northern", label: "Take a picture of the Northern Lights", clipHint: "a photo of Northern Lights in Iceland" },
    { id: "iceland_waterfall", label: "Take a picture of a waterfall", clipHint: "a photo of a waterfall in Iceland" },
  ],
},
{
  city: "Toronto", country: "Canada", emoji: "🇨🇦",
  tasks: [
    { id: "toronto_cn", label: "Take a picture of the CN Tower", clipHint: "a photo of CN Tower in Toronto" },
    { id: "toronto_street", label: "Take a picture of a busy street", clipHint: "a photo of downtown Toronto street" },
  ],
},
];

// ─── Landmark facts ───────────────────────────────────────────────────────────
const LANDMARK_FACTS = {
  paris_eiffel:    { title: "Eiffel Tower",        year: "Built 1887–1889", fact: "Gustave Eiffel's iron lattice tower was originally meant to be dismantled after 20 years. It was saved because its antenna proved invaluable for radio transmissions.", detail: "Standing at 330 metres, it was the world's tallest structure for 41 years and is repainted with 60 tonnes of paint every 7 years." },
  paris_arc:       { title: "Arc de Triomphe",     year: "Completed 1836",  fact: "Napoleon commissioned this monument to honour the French army — but died 15 years before its completion and never saw it finished.", detail: "Beneath the arch lies the Tomb of the Unknown Soldier, with a flame that has burned continuously since 1923." },
  dublin_spire:    { title: "The Spire of Dublin", year: "Erected 2003",    fact: "Officially called the Monument of Light, the 121-metre stainless-steel spire replaced Nelson's Pillar, which was blown up in 1966.", detail: "The base is 3 metres wide and tapers to just 15 cm at the very tip. It glows at night like a needle of light over O'Connell Street." },
  dublin_liffey:   { title: "River Liffey",        year: "Ancient origin",  fact: "The Liffey flows 132 km from the Wicklow Mountains to Dublin Bay, splitting the city into Northside and Southside — a distinction Dubliners still take very seriously.", detail: "Sixteen bridges cross it through the city centre. The most famous, the Ha'penny Bridge, was built in 1816 and named after the toll once charged to cross it." },
  london_bigben:   { title: "Big Ben",             year: "First rang 1859", fact: "'Big Ben' technically refers only to the 13.7-tonne Great Bell inside the Elizabeth Tower — not the tower itself.", detail: "The clock's famous accuracy is maintained by a stack of old pennies on the pendulum. Adding or removing a coin shifts the tick by 0.4 seconds per day." },
  galway_anything: { title: "Galway",              year: "Founded c. 1124", fact: "Known as the City of Tribes after 14 merchant families, Galway is one of the few places where Irish is still spoken as a daily language.", detail: "The city hosts one of Europe's largest arts festivals every July, drawing over 200,000 visitors to its medieval streets." },


  rome_colosseum: {
    title: "Colosseum",
    year: "Completed 80 AD",
    fact: "The Colosseum could hold up to 50,000 spectators who came to watch gladiator battles, animal hunts, and even mock naval battles.",
    detail: "It remains the largest ancient amphitheatre ever built and is one of the greatest feats of Roman engineering."
  },
  rome_trevi: {
    title: "Trevi Fountain",
    year: "Completed 1762",
    fact: "Throwing a coin into the fountain is said to ensure your return to Rome — around €3,000 is collected daily.",
    detail: "The coins are donated to charity, helping fund food and services for people in need."
  },

  ny_statue: {
    title: "Statue of Liberty",
    year: "Dedicated 1886",
    fact: "The statue was a gift from France to the United States to celebrate friendship and freedom.",
    detail: "Its full name is 'Liberty Enlightening the World', and it was originally a copper colour before oxidising to green."
  },
  ny_times: {
    title: "Times Square",
    year: "Named 1904",
    fact: "Originally called Longacre Square, it was renamed after The New York Times moved its headquarters there.",
    detail: "Over 300,000 pedestrians pass through Times Square daily, making it one of the busiest places on Earth."
  },

  tokyo_crossing: {
    title: "Shibuya Crossing",
    year: "Modern era",
    fact: "Often called the busiest pedestrian crossing in the world, up to 3,000 people cross at once during peak times.",
    detail: "It has become a global symbol of Tokyo’s energy and urban life."
  },
  tokyo_tower: {
    title: "Tokyo Tower",
    year: "Completed 1958",
    fact: "Inspired by the Eiffel Tower, it is actually 13 metres taller than its Paris counterpart.",
    detail: "It serves as a communications and observation tower and is painted orange and white for air safety."
  },

  barcelona_sagrada: {
    title: "Sagrada Familia",
    year: "Construction started 1882",
    fact: "This basilica designed by Antoni Gaudí is still under construction over 140 years later.",
    detail: "It is expected to be completed in the coming decades, funded largely by tourism."
  },
  barcelona_beach: {
    title: "Barceloneta Beach",
    year: "Modern development",
    fact: "The beach was created in the 1990s as part of a major redevelopment for the 1992 Olympics.",
    detail: "It is now one of the most popular urban beaches in Europe."
  },

  dubai_burj: {
    title: "Burj Khalifa",
    year: "Completed 2010",
    fact: "At 828 metres, it is the tallest building in the world.",
    detail: "You can watch the sunset twice in one evening — once from the ground and again from the top."
  },
  dubai_desert: {
    title: "Arabian Desert",
    year: "Ancient",
    fact: "The desert covers most of the Arabian Peninsula and is known for its vast sand dunes.",
    detail: "Temperatures can swing from over 45°C in the day to near freezing at night."
  },

  sydney_opera: {
    title: "Sydney Opera House",
    year: "Opened 1973",
    fact: "Its unique shell design was inspired by orange peels.",
    detail: "It is one of the most recognisable buildings in the world and a UNESCO World Heritage Site."
  },
  sydney_bridge: {
    title: "Sydney Harbour Bridge",
    year: "Opened 1932",
    fact: "Nicknamed 'The Coathanger' due to its shape.",
    detail: "Climbing the bridge has become a popular tourist activity offering panoramic city views."
  },

  capetown_table: {
    title: "Table Mountain",
    year: "Over 260 million years old",
    fact: "The flat top is often covered by clouds known locally as the 'tablecloth'.",
    detail: "It is one of the New 7 Wonders of Nature."
  },
  capetown_beach: {
    title: "Cape Town Coastline",
    year: "Natural",
    fact: "Cape Town is one of the few places where you can see two oceans meet — the Atlantic and Indian Oceans.",
    detail: "Its beaches are famous for dramatic scenery and cold, clear waters."
  },

  amsterdam_canal: {
    title: "Amsterdam Canals",
    year: "17th century",
    fact: "The canal ring was built during the Dutch Golden Age and is a UNESCO World Heritage Site.",
    detail: "There are over 100 km of canals and more bridges than Venice."
  },
  amsterdam_bike: {
    title: "Cycling Culture",
    year: "Modern",
    fact: "There are more bicycles than people in Amsterdam.",
    detail: "Cycling is the main mode of transport for many residents."
  },

  berlin_gate: {
    title: "Brandenburg Gate",
    year: "Completed 1791",
    fact: "It once stood between East and West Berlin during the Cold War.",
    detail: "Today it symbolises German unity and peace."
  },
  berlin_wall: {
    title: "Berlin Wall",
    year: "Built 1961",
    fact: "The wall divided Berlin for 28 years before falling in 1989.",
    detail: "Sections remain as a memorial and open-air gallery."
  },

  rio_christ: {
    title: "Christ the Redeemer",
    year: "Completed 1931",
    fact: "The statue stands 30 metres tall and overlooks Rio from Mount Corcovado.",
    detail: "It is one of the New 7 Wonders of the World."
  },
  rio_beach: {
    title: "Copacabana Beach",
    year: "Modern",
    fact: "The beach stretches 4 km and is famous for its black-and-white wave-pattern promenade.",
    detail: "It hosts huge events, including New Year’s celebrations."
  },

  iceland_northern: {
    title: "Northern Lights",
    year: "Natural phenomenon",
    fact: "The lights are caused by solar particles colliding with Earth’s atmosphere.",
    detail: "They appear in shifting colours like green, purple, and pink."
  },
  iceland_waterfall: {
    title: "Icelandic Waterfalls",
    year: "Natural",
    fact: "Iceland has thousands of waterfalls due to its glaciers and volcanic landscape.",
    detail: "Some of the most famous include Gullfoss and Skógafoss."
  },

  toronto_cn: {
    title: "CN Tower",
    year: "Completed 1976",
    fact: "It was the world’s tallest free-standing structure for over 30 years.",
    detail: "Visitors can walk on a glass floor 342 metres above the ground."
  },
  toronto_street: {
    title: "Downtown Toronto",
    year: "Modern",
    fact: "Toronto is one of the most multicultural cities in the world.",
    detail: "Over half of its population was born outside Canada."
  },
};

// ─── Location helper ──────────────────────────────────────────────────────────
function requestLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
        longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        accuracy:  Math.round(pos.coords.accuracy),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ─── Camera overlay ───────────────────────────────────────────────────────────
function CameraOverlay({ onCaptures, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captures,  setCaptures]  = useState([]);
  const [flash,     setFlash]     = useState(false);
  const [locStatus, setLocStatus] = useState("idle");
  const maxPhotos = 5;

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", aspectRatio: { ideal: 9 / 16 } } })
      .then((s) => {
        streamRef.current = s;
        const v = videoRef.current;
        if (!v) return;
        v.muted = true; v.srcObject = s;
        v.onloadedmetadata = () => v.play();
      }).catch(console.error);

    setLocStatus("requesting");
    requestLocation().then((c) => setLocStatus(c ? "granted" : "denied"));

    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const capture = useCallback(() => {
    if (captures.length >= maxPhotos) return;
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    setCaptures((p) => [...p, c.toDataURL("image/jpeg", 0.85)]);
  }, [captures.length]);

  const handleUse = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCaptures(captures);
  };

  const locInfo = {
    idle:       null,
    requesting: { color: "#f59e0b", label: "Getting location…" },
    granted:    { color: "#22c55e", label: "📍 Location ready" },
    denied:     { color: "#ef4444", label: "⚠️ No location" },
  }[locStatus];

  return (
    <div style={camS.overlay}>
      {flash && <div style={camS.flash} />}
      <video ref={videoRef} autoPlay playsInline muted style={camS.video} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={camS.topBar}>
        <button style={camS.closeBtn} onClick={onClose}>✕</button>
        {locInfo && (
          <div style={{ ...camS.pill, borderColor: locInfo.color }}>
            <span style={{ color: locInfo.color, fontSize: 11, fontWeight: 700 }}>{locInfo.label}</span>
          </div>
        )}
        <span style={camS.counter}>{captures.length}/{maxPhotos}</span>
      </div>

      {captures.length > 0 && (
        <div style={camS.thumbRow}>
          {captures.map((u, i) => <img key={i} src={u} style={camS.thumb} alt="" />)}
        </div>
      )}

      <div style={camS.bottomBar}>
        <div style={{ width: 56 }} />
        <button
          style={{ ...camS.shutter, opacity: captures.length >= maxPhotos ? 0.4 : 1 }}
          onClick={capture} disabled={captures.length >= maxPhotos}
        >
          <div style={camS.shutterInner} />
        </button>
        <button
          style={{ ...camS.doneBtn, opacity: captures.length === 0 ? 0.35 : 1 }}
          disabled={captures.length === 0}
          onClick={handleUse}
        >
          Use
        </button>
      </div>
    </div>
  );
}

const camS = {
  overlay:      { position: "fixed", inset: 0, background: "#000", zIndex: 999, display: "flex", flexDirection: "column" },
  flash:        { position: "absolute", inset: 0, background: "#fff", opacity: 0.8, zIndex: 10, pointerEvents: "none" },
  video:        { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  topBar:       { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 16px", background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" },
  closeBtn:     { background: "rgba(0,0,0,0.35)", border: "none", color: "#fff", fontSize: 16, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pill:         { display: "flex", alignItems: "center", background: "rgba(0,0,0,0.45)", border: "1px solid", borderRadius: 20, padding: "4px 10px" },
  counter:      { color: "#fff", fontSize: 14, fontWeight: 600, background: "rgba(0,0,0,0.35)", padding: "4px 12px", borderRadius: 20, flexShrink: 0 },
  thumbRow:     { position: "absolute", bottom: 160, left: 0, right: 0, zIndex: 20, display: "flex", gap: 8, padding: "0 20px", justifyContent: "center" },
  thumb:        { width: 52, height: 52, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(255,255,255,0.7)" },
  bottomBar:    { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px 60px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" },
  shutter:      { width: 68, height: 68, borderRadius: "50%", border: "3px solid #fff", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 54, height: 54, borderRadius: "50%", background: "#fff" },
  doneBtn:      { background: "#3B7EF6", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, padding: "10px 20px", borderRadius: 22, cursor: "pointer", width: 64, fontFamily: "inherit" },
};

// ─── Success modal ────────────────────────────────────────────────────────────
function SuccessModal({ task, photo, result, onBack }) {
  const info = LANDMARK_FACTS[task.id];
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={ms.backdrop}>
      <div style={ms.sheet}>
        <div style={ms.photoWrap}>
          <img src={photo} alt="capture" style={{ ...ms.photo, opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} />
          <div style={ms.awardBadge}>🏅</div>
          <div style={ms.photoStats}>
            {result.distanceM  != null && <span style={ms.pill}>📍 {result.distanceM}m away</span>}
            {result.similarity != null && <span style={ms.pill}>✦ {Math.round(result.similarity * 100)}% match</span>}
          </div>
        </div>
        <div style={ms.body}>
          <div style={ms.tag}>Challenge complete</div>
          <h2 style={ms.h2}>{info?.title ?? task.label}</h2>
          {info?.year && <p style={ms.year}>{info.year}</p>}
          <div style={ms.rule} />
          {info && (
            <>
              <div style={ms.factBlock}><p style={ms.fl}>Did you know?</p><p style={ms.ft}>{info.fact}</p></div>
              <div style={ms.factBlock}><p style={ms.fl}>More about this place</p><p style={ms.ft}>{info.detail}</p></div>
            </>
          )}
          <button style={ms.btn} onClick={onBack}>← Back to challenges</button>
        </div>
      </div>
    </div>
  );
}

const ms = {
  backdrop:  { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" },
  sheet:     { background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "92dvh", overflowY: "auto" },
  photoWrap: { position: "relative", width: "100%", height: 280, background: "#dde4f7", flexShrink: 0 },
  photo:     { width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" },
  awardBadge:{ position: "absolute", top: 16, right: 16, fontSize: 34, background: "rgba(255,255,255,0.92)", borderRadius: "50%", width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center" },
  photoStats:{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(to top,rgba(0,0,0,0.55),transparent)", display: "flex", gap: 8 },
  pill:      { fontSize: 12, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 20, padding: "3px 10px" },
  body:      { padding: "22px 20px 44px" },
  tag:       { display: "inline-block", fontSize: 12, fontWeight: 700, color: "#15803d", background: "#dcfce7", borderRadius: 20, padding: "4px 12px", marginBottom: 10 },
  h2:        { margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#1a1f3a", letterSpacing: "-0.4px" },
  year:      { margin: 0, fontSize: 13, color: "#8891b8", fontWeight: 500 },
  rule:      { height: 1, background: "#f0f2f8", margin: "18px 0" },
  factBlock: { marginBottom: 18 },
  fl:        { margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#8891b8", textTransform: "uppercase", letterSpacing: "0.07em" },
  ft:        { margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.65 },
  btn:       { marginTop: 28, width: "100%", padding: 16, background: "linear-gradient(135deg,#3B7EF6,#7B5CF6)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};

// ─── Failure modal ────────────────────────────────────────────────────────────
function FailureModal({ result, onRetry, onClose }) {
  const MSGS = {
    location_missing: { icon: "📍", h: "Location needed",     b: "Please enable GPS on your device so we can confirm you're at the landmark, then try again." },
    too_far:          { icon: "🗺️", h: "You're too far away",  b: result?.message ?? "Move closer to the landmark and try again." },
    wrong_landmark:   { icon: "📷", h: "Not quite right",     b: "The photo doesn't match. Try a clearer, closer shot with the landmark front and centre." },
    already_complete: { icon: "🏅", h: "Already done!",       b: "You've already completed this challenge. Go find another one!" },
    unknown_task:     { icon: "❓", h: "Unknown challenge",    b: "This challenge wasn't recognised. Please try again." },
  };
  const reason  = result?.reason ?? "unknown_task";
  const msg     = MSGS[reason] ?? { icon: "⚠️", h: "Something went wrong", b: result?.message ?? "Please try again." };
  const isDone  = reason === "already_complete";
  const isFar   = reason === "too_far" && result?.distanceM != null;
  const fillPct = isFar ? Math.min(96, Math.round((500 / result.distanceM) * 100)) : 0;

  return (
    <div style={mf.backdrop}>
      <div style={mf.sheet}>
        <div style={mf.topBar}><button style={mf.x} onClick={onClose}>✕</button></div>
        <div style={mf.body}>
          <div style={mf.icon}>{msg.icon}</div>
          <h2 style={mf.h2}>{msg.h}</h2>
          <p style={mf.p}>{msg.b}</p>
          {isFar && (
            <div style={mf.dist}>
              <div style={mf.distRow}><span>You</span><span>Landmark</span></div>
              <div style={mf.track}>
                <div style={{ ...mf.fill, width: `${fillPct}%` }} />
                <div style={{ ...mf.marker, left: `${fillPct}%` }} />
              </div>
              <p style={mf.distP}>{result.distanceM}m away — need to be within 500m</p>
            </div>
          )}
          {!isDone && <button style={mf.retry} onClick={onRetry}>Try again</button>}
          <button style={mf.cancel} onClick={onClose}>{isDone ? "Back to challenges" : "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}

const mf = {
  backdrop: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" },
  sheet:    { background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", paddingBottom: 40 },
  topBar:   { display: "flex", justifyContent: "flex-end", padding: "16px 16px 0" },
  x:        { background: "#f0f2f8", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3250", fontSize: 16 },
  body:     { padding: "4px 24px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  icon:     { width: 76, height: 76, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 16 },
  h2:       { margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#1a1f3a" },
  p:        { margin: "0 0 22px", fontSize: 15, color: "#4b5563", lineHeight: 1.65, maxWidth: 300 },
  dist:     { width: "100%", marginBottom: 22 },
  distRow:  { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8891b8", fontWeight: 600, marginBottom: 6 },
  track:    { height: 8, background: "#f0f2f8", borderRadius: 4, position: "relative", overflow: "visible" },
  fill:     { height: "100%", background: "linear-gradient(90deg,#3B7EF6,#7B5CF6)", borderRadius: 4 },
  marker:   { position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "#3B7EF6", border: "2px solid #fff" },
  distP:    { margin: "8px 0 0", fontSize: 12, color: "#8891b8" },
  retry:    { width: "100%", padding: 16, background: "linear-gradient(135deg,#3B7EF6,#7B5CF6)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" },
  cancel:   { width: "100%", padding: 14, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 16, color: "#6b7280", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, completed, markCompleted }) {
  const [status,     setStatus]     = useState(completed ? "done" : "idle");
  const [modal,      setModal]      = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [step,       setStep]       = useState("");

  useEffect(() => {
    if (completed) setStatus("done");
  }, [completed]);

  const handleCaptures = async (imgs) => {
    setShowCamera(false);
    if (!imgs.length) return;
    setStatus("submitting");

    try {
      setStep("Getting location…");
      const location = await requestLocation();

      setStep("Sending to server…");
      const form = new FormData();
      form.append("taskId",     task.id);
      form.append("clipHint",   task.clipHint);
      form.append("capturedAt", new Date().toISOString());
      form.append("location",   JSON.stringify(location));

      for (let i = 0; i < imgs.length; i++) {
        const res  = await fetch(imgs[i]);
        const blob = await res.blob();
        form.append("images", blob, `photo_${i}.jpg`);
      }

      console.group(`📤 /challenge-submit  •  ${task.id}`);
      console.log("clipHint:", task.clipHint);
      console.log("location:", location);
      console.log("photos:",   `${imgs.length} image(s) attached as multipart`);
      console.groupEnd();

      const response = await fetch("http://https://tripmemo-11.onrender.com/challenge-submit", {
        method:      "POST",
        credentials: "include",
        body:        form,
      });

      const result = await response.json();

      if (result.success) {
        setStatus("done");
        markCompleted(task.id);
        setModal({ type: "success", result, photo: imgs[0] });
      } else {
        setStatus("idle");
        setModal({ type: "failure", result });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setStatus("idle");
      setModal({ type: "failure", result: { reason: "unknown_task", message: "Network error. Please try again." } });
    } finally {
      setStep("");
    }
  };

  return (
    <>
      {showCamera && <CameraOverlay onCaptures={handleCaptures} onClose={() => setShowCamera(false)} />}
      {modal?.type === "success" && <SuccessModal task={task} photo={modal.photo} result={modal.result} onBack={() => setModal(null)} />}
      {modal?.type === "failure" && <FailureModal result={modal.result} onRetry={() => { setModal(null); setShowCamera(true); }} onClose={() => setModal(null)} />}

      <div style={pg.taskRow}>
        <div style={pg.awardWrap}>
          {status === "done"
            ? <span style={{ fontSize: 24 }}>🏅</span>
            : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0c8e8" strokeWidth="1.5"><circle cx="12" cy="8" r="5" /><path d="M7 13l-3 8h16l-3-8" /></svg>}
        </div>
        <div style={pg.labelCol}>
          <span style={{ ...pg.labelText, color: status === "done" ? "#22c55e" : "#2d3250" }}>{task.label}</span>
          {status === "done"       && <span style={pg.doneBadge}>Completed ✓</span>}
          {status === "submitting" && <span style={pg.subBadge}>{step || "Processing…"}</span>}
        </div>
        <button
          style={{ ...pg.camBtn, ...(status === "done" ? pg.camBtnDone : {}), ...(status === "submitting" ? { opacity: 0.45, pointerEvents: "none" } : {}) }}
          onClick={() => setShowCamera(true)}
          disabled={status === "submitting"}
        >
          {status === "done"
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
        </button>
      </div>
    </>
  );
}

// ─── CitySection ─────────────────────────────────────────────────────────────
function CitySection({ city, country, emoji, tasks, completed, markCompleted }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={pg.cityCard}>
      <button style={pg.cityHeader} onClick={() => setExpanded((e) => !e)}>
        <div style={pg.cityLeft}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
          <div>
            <div style={pg.cityName}>{city}</div>
            <div style={pg.cityCountry}>{country}</div>
          </div>
        </div>
        <div style={pg.cityRight}>
          <span style={pg.taskCount}>{tasks.length} challenge{tasks.length !== 1 ? "s" : ""}</span>
          <span style={{ display: "flex", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8891b8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: "1px solid #f0f2f8", display: "flex", flexDirection: "column" }}>
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              completed={completed.includes(t.id)}
              markCompleted={markCompleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function Challenges({ setActiveTab }) {
  const [completed, setCompleted] = useState([]);

  const markCompleted = (id) => setCompleted((prev) => [...new Set([...prev, id])]);

  useEffect(() => {
    fetch("http://https://tripmemo-11.onrender.com/challenges/completed", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCompleted(data.map((c) => c.task_id)))
      .catch(console.error);
  }, []);

  return (
    <div style={pg.page}>
      <div style={pg.header}>
        <button style={pg.backBtn} onClick={() => setActiveTab?.("home")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d3250" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <span style={pg.badge}>🏆 Challenges</span>
      </div>
      <div style={{ padding: "12px 20px 20px" }}>
        <h1 style={pg.title}>City Challenges</h1>
        <p style={pg.subtitle}>Capture landmarks to earn awards</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 16px" }}>
        {CHALLENGES.map((c) => (
          <CitySection
            key={c.city}
            {...c}
            completed={completed}
            markCompleted={markCompleted}
          />
        ))}
      </div>
    </div>
  );
}

const pg = {
  page:        { minHeight: "100dvh", background: "#f0f2f8", padding: "0 0 100px", fontFamily: "'Nunito','Segoe UI',sans-serif" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "56px 20px 8px" },
  backBtn:     { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "#2d3250", cursor: "pointer", fontFamily: "inherit" },
  badge:       { background: "linear-gradient(135deg,#3B7EF6,#7B5CF6)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20 },
  title:       { margin: 0, fontSize: 28, fontWeight: 800, color: "#1a1f3a", letterSpacing: "-0.5px" },
  subtitle:    { margin: "4px 0 0", fontSize: 14, color: "#8891b8", fontWeight: 500 },
  cityCard:    { background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(60,80,180,0.07)" },
  cityHeader:  { width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", cursor: "pointer", fontFamily: "inherit" },
  cityLeft:    { display: "flex", alignItems: "center", gap: 12 },
  cityName:    { fontSize: 17, fontWeight: 800, color: "#1a1f3a", textAlign: "left" },
  cityCountry: { fontSize: 12, color: "#8891b8", fontWeight: 500, textAlign: "left" },
  cityRight:   { display: "flex", alignItems: "center", gap: 8 },
  taskCount:   { fontSize: 12, color: "#8891b8", fontWeight: 600, background: "#f0f2f8", padding: "3px 10px", borderRadius: 10 },
  taskRow:     { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f7f8fc" },
  awardWrap:   { flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#e8ecff,#f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center" },
  labelCol:    { flex: 1, display: "flex", flexDirection: "column", gap: 3 },
  labelText:   { fontSize: 14, fontWeight: 600, lineHeight: 1.3 },
  doneBadge:   { fontSize: 11, color: "#22c55e", fontWeight: 700 },
  subBadge:    { fontSize: 11, color: "#8891b8", fontWeight: 600 },
  camBtn:      { flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#3B7EF6,#7B5CF6)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  camBtnDone:  { background: "linear-gradient(135deg,#22c55e,#16a34a)" },
};

export default Challenges;