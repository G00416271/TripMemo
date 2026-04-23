import { useState, useRef, useCallback } from "react";
import ExifReader from "exifreader";
import { useAuth } from "./Auth.jsx";

// ── EXIF helpers (logic unchanged) ───────────────────────────────────────────
function pickTag(tags, paths) {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = tags;
    for (const part of parts) cur = cur?.[part];
    if (cur?.description != null) return cur.description;
    if (cur?.value != null) return cur.value;
  }
  return null;
}

function toDecimalDegrees(value, ref) {
  const sign = ref === "S" || ref === "W" ? -1 : 1;
  if (typeof value === "number") return value * sign;
  if (Array.isArray(value)) {
    const nums = value.map((v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") return parseFloat(v);
      if (v && typeof v === "object" && "numerator" in v && "denominator" in v && v.denominator)
        return v.numerator / v.denominator;
      return NaN;
    });
    const [d, m = 0, s = 0] = nums;
    if ([d, m, s].some(isNaN)) return null;
    return sign * (Math.abs(d) + m / 60 + s / 3600);
  }
  if (typeof value === "string") {
    const parts = value.replace(/[^\d.+-]+/g, " ").trim().split(/\s+/).map(parseFloat);
    const [d, m = 0, s = 0] = parts;
    if ([d, m, s].some(isNaN)) return null;
    return sign * (Math.abs(d) + m / 60 + s / 3600);
  }
  return null;
}

function extractGps(tags) {
  const latRaw = pickTag(tags, ["gps.Latitude", "gps.GPSLatitude", "GPSLatitude"]);
  const lonRaw = pickTag(tags, ["gps.Longitude", "gps.GPSLongitude", "GPSLongitude"]);
  const latRef = pickTag(tags, ["gps.LatitudeRef", "gps.GPSLatitudeRef", "GPSLatitudeRef"]);
  const lonRef = pickTag(tags, ["gps.LongitudeRef", "gps.GPSLongitudeRef", "GPSLongitudeRef"]);
  if (latRaw == null || lonRaw == null) return { gpsLatitude: null, gpsLongitude: null };
  return {
    gpsLatitude: toDecimalDegrees(latRaw, latRef) ?? null,
    gpsLongitude: toDecimalDegrees(lonRaw, lonRef) ?? null,
  };
}

function buildServerData(serverResponse) {
  if (!Array.isArray(serverResponse)) return [];
  const counts = new Map();
  for (const image of serverResponse) {
    const allTags = [
      ...(Array.isArray(image.full_image_tags) ? image.full_image_tags : []),
      ...(Array.isArray(image.ocr_summary) ? image.ocr_summary : []),
      ...(Array.isArray(image.objects)
        ? image.objects.flatMap((o) => (Array.isArray(o.clip_tags) ? o.clip_tags : []))
        : []),
    ];
    for (const tag of allTags) {
      if (!tag || typeof tag !== "string") continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UploadFiles({
  onUploadComplete,
  memoryId,
  memoryName,
  onFilesReady,
  onBack,
}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | reading | uploading | done | error
  const [msg, setMsg] = useState("");
  const [tags, setTags] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { user } = useAuth();

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((p) => [...p, { name: f.name, size: f.size, url: e.target.result }]);
      reader.readAsDataURL(f);
    });
  }, []);

  const removeFile = (idx) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length || !memoryId) {
      setPhase("error");
      setMsg(!memoryId ? "No memory selected." : "Please add photos first.");
      return;
    }

    setPhase("reading");
    setMsg("Reading metadata…");

    let metas = [];
    try {
      metas = await Promise.all(
        files.map(async (f) => {
          try {
            const buf = await f.arrayBuffer();
            const exif = ExifReader.load(buf, { expanded: true });
            return {
              fileName: f.name,
              fileSize: f.size,
              ...extractGps(exif),
              make: pickTag(exif, ["exif.Make"]) ?? null,
              model: pickTag(exif, ["exif.Model"]) ?? null,
              dateTimeOriginal: pickTag(exif, ["exif.DateTimeOriginal"]) ?? null,
              orientation: pickTag(exif, ["image.Orientation"]) ?? null,
            };
          } catch {
            return { fileName: f.name, error: "No EXIF" };
          }
        })
      );
    } catch { metas = []; }

    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    fd.append("user", user.username);
    fd.append("memory_id", memoryId);
    fd.append("metadata", JSON.stringify(metas));

    setPhase("uploading");
    setMsg("Analysing with AI…");

    try {
      const res = await fetch("https://tripmemo-11.onrender.com/process-images", { method: "POST", body: fd });
      if (!res.ok) { setPhase("error"); setMsg("Upload failed."); return; }
      const data = await res.json();
      const aggregated = buildServerData(data);
      setTags(aggregated);
      setPhase("done");
      setMsg(`${files.length} photo${files.length !== 1 ? "s" : ""} uploaded`);
      onFilesReady?.(files);
      onUploadComplete?.(aggregated);
    } catch {
      setPhase("error");
      setMsg("Connection error.");
    }
  }

  const busy = phase === "reading" || phase === "uploading";

  return (
    <div style={s.page}>
      <style>{injectCss}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        {onBack && (
          <button style={s.backBtn} onClick={onBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div style={s.headerText}>
          <h1 style={s.title}>Add Photos</h1>
          {memoryName && <p style={s.subtitle}>to <em style={{ fontStyle: "normal", color: "#FF0055" }}>{memoryName}</em></p>}
        </div>
        <div style={s.headerBadge}>
          {files.length > 0 && <span style={s.badge}>{files.length}</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>

        {/* ── Drop zone ── */}
        <div
          style={{
            ...s.dropzone,
            ...(dragOver ? s.dropzoneOver : {}),
            ...(files.length ? s.dropzoneFilled : {}),
          }}
          onClick={() => !files.length && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />

          {files.length === 0 ? (
            /* Empty state */
            <div style={s.emptyZone}>
              <div style={s.uploadIcon}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={s.emptyTitle}>Drop photos here</p>
              <p style={s.emptySub}>or tap to browse · JPG PNG HEIC</p>
            </div>
          ) : (
            /* Preview grid */
            <div style={s.grid} onClick={(e) => e.stopPropagation()}>
              {previews.map((p, i) => (
                <div key={p.name + i} style={s.previewCard} className="ul-card">
                  <img src={p.url} alt={p.name} style={s.previewImg} />
                  <div style={s.previewOverlay} className="ul-overlay">
                    <button
                      type="button"
                      style={s.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <span style={s.previewSize}>{formatBytes(p.size)}</span>
                  </div>
                </div>
              ))}
              {/* Add more tile */}
              <div
                style={s.addMoreTile}
                className="ul-addmore"
                onClick={() => inputRef.current?.click()}
              >
                <div style={s.addMoreIcon}>+</div>
                <span style={s.addMoreLabel}>More</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Status ── */}
        {phase !== "idle" && (
          <div style={{
            ...s.statusBar,
            ...(phase === "done" ? s.statusDone
              : phase === "error" ? s.statusErr
              : s.statusBusy),
          }}>
            {busy && <span className="ul-spinner" style={s.spinner} />}
            {phase === "done" && <span style={s.statusIcon}>✓</span>}
            {phase === "error" && <span style={s.statusIcon}>✕</span>}
            <span style={s.statusText}>{msg}</span>
          </div>
        )}

        {/* ── Detected tags ── */}
        {tags.length > 0 && (
          <div style={s.tagsBox}>
            <p style={s.tagsHeading}>Detected tags</p>
            <div style={s.tagsList}>
              {tags.slice(0, 24).map((t) => (
                <span key={t} style={s.tag}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={!files.length || busy}
          style={{
            ...s.submitBtn,
            ...(!files.length || busy ? s.submitOff : {}),
          }}
          className={files.length && !busy ? "ul-submit" : ""}
        >
          {busy
            ? <span style={s.submitInner}><span className="ul-spinner ul-spinner-white" style={s.spinnerSm} />{msg}</span>
            : phase === "done"
            ? "✓  Upload complete — Open Canvas"
            : "Upload & Analyse"}
        </button>

      </form>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    background: "#0e0e16",
    color: "#ede9ff",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    paddingBottom: 120,
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "22px 20px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#ede9ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.18s",
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 22,
    fontWeight: 900,
    color: "#ede9ff",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(237,233,255,0.4)",
    margin: "3px 0 0",
    fontWeight: 500,
  },
  headerBadge: { flexShrink: 0 },
  badge: {
    background: "#FF0055",
    color: "white",
    fontSize: 12,
    fontWeight: 800,
    padding: "3px 9px",
    borderRadius: 20,
    fontFamily: "'Nunito', sans-serif",
  },

  // Form
  form: {
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    flex: 1,
  },

  // Drop zone
  dropzone: {
    borderRadius: 20,
    border: "2px dashed rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.02)",
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
    overflow: "hidden",
  },
  dropzoneOver: {
    border: "2px dashed #FF0055",
    background: "rgba(255,0,85,0.05)",
    transform: "scale(1.01)",
  },
  dropzoneFilled: {
    cursor: "default",
    minHeight: "auto",
    padding: 14,
    border: "2px dashed rgba(255,255,255,0.07)",
    alignItems: "flex-start",
  },

  // Empty state
  emptyZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "40px 24px",
    textAlign: "center",
  },
  uploadIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    background: "rgba(255,0,85,0.1)",
    border: "1.5px solid rgba(255,0,85,0.22)",
    color: "#FF0055",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 17,
    fontWeight: 800,
    color: "#ede9ff",
    margin: 0,
  },
  emptySub: {
    fontSize: 12,
    color: "rgba(237,233,255,0.35)",
    margin: 0,
    letterSpacing: "0.02em",
  },

  // Preview grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
    gap: 10,
    width: "100%",
  },
  previewCard: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: "1",
    background: "#1c1c2a",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.55) 100%)",
    opacity: 0,
    transition: "opacity 0.18s",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 6,
  },
  removeBtn: {
    alignSelf: "flex-end",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.65)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewSize: {
    fontSize: 9,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  addMoreTile: {
    borderRadius: 12,
    border: "2px dashed rgba(255,0,85,0.3)",
    background: "rgba(255,0,85,0.04)",
    aspectRatio: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
    transition: "all 0.18s",
  },
  addMoreIcon: {
    fontSize: 24,
    color: "#FF0055",
    lineHeight: 1,
    fontWeight: 300,
  },
  addMoreLabel: {
    fontSize: 10,
    color: "#FF0055",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  // Status bar
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
  },
  statusBusy: {
    background: "rgba(0,216,255,0.07)",
    border: "1px solid rgba(0,216,255,0.18)",
    color: "#00D8FF",
  },
  statusDone: {
    background: "rgba(52,199,89,0.08)",
    border: "1px solid rgba(52,199,89,0.22)",
    color: "#34C759",
  },
  statusErr: {
    background: "rgba(255,59,48,0.08)",
    border: "1px solid rgba(255,59,48,0.22)",
    color: "#FF3B30",
  },
  statusIcon: { fontSize: 14 },
  statusText: { flex: 1 },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(0,216,255,0.2)",
    borderTopColor: "#00D8FF",
    display: "inline-block",
    flexShrink: 0,
  },
  spinnerSm: {
    width: 13,
    height: 13,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "white",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },

  // Tags
  tagsBox: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
  },
  tagsHeading: {
    fontSize: 10,
    fontWeight: 700,
    color: "rgba(237,233,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    margin: "0 0 10px",
  },
  tagsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    background: "rgba(255,0,85,0.1)",
    border: "1px solid rgba(255,0,85,0.2)",
    color: "#ff7aaa",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },

  // Submit
  submitBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #FF0055 0%, #ff6b9d 100%)",
    color: "white",
    fontSize: 15,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    boxShadow: "0 8px 28px rgba(255,0,85,0.35)",
    transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
    letterSpacing: "0.01em",
  },
  submitOff: {
    background: "rgba(255,255,255,0.05)",
    boxShadow: "none",
    color: "rgba(237,233,255,0.25)",
    cursor: "not-allowed",
  },
  submitInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
};

const injectCss = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

  @keyframes ul-spin { to { transform: rotate(360deg); } }

  .ul-spinner { animation: ul-spin 0.85s linear infinite; }
  .ul-spinner-white { border-color: rgba(255,255,255,0.2) !important; border-top-color: white !important; }

  .ul-card:hover .ul-overlay { opacity: 1 !important; }

  .ul-addmore:hover {
    border-color: #FF0055 !important;
    background: rgba(255,0,85,0.09) !important;
    transform: scale(1.04);
  }

  .ul-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(255,0,85,0.45) !important;
  }
  .ul-submit:active { transform: scale(0.98); }
`;