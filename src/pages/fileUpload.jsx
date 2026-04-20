import UploadFiles from "../uploadFiles.jsx";

export default function FileUpload({
  memoryId,
  memoryName,
  onFilesReady,
  onUploadComplete,
  setActiveTab,
  avatarUrl,
}) {
  return (
    <UploadFiles
      memoryId={memoryId}
      memoryName={memoryName}
      onFilesReady={onFilesReady}
      onUploadComplete={onUploadComplete}
      avatarUrl={avatarUrl}
      onBack={() => setActiveTab("create")}
    />
  );
}