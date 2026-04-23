export function proxy(url) {
  if (!url || typeof url !== "string") return "";
  return `http://https://tripmemo-11.onrender.com/api/image-proxy?url=${encodeURIComponent(url)}`;
}