import NavBar from "../NavBar.jsx";
import UploadFiles from "../uploadFiles.jsx";

document.oncontextmenu = () => false;

export default function FileUpload({
  memoryId,
  memoryName,
  onFilesReady,
  onUploadComplete,
}) {
  return (
    <div id="navbar" style={{ display: "flex", padding: 0 }}>
      <NavBar />
      <div style={{ display: "flex", padding: 10 }}>
        <UploadFiles
          memoryId={memoryId}
          memoryName={memoryName}
          onFilesReady={onFilesReady}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </div>
  );
}
