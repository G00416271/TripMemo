export function proxy(url) {
  if (!url || typeof url !== "string") return "";
  return `http://localhost:5000/api/image-proxy?url=${encodeURIComponent(url)}`;
}