const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const buildFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return null;

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  return `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};
