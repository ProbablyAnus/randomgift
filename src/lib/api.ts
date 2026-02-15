const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

export const buildApiUrl = (path: string) => {
  const baseUrl = normalizeBaseUrl(import.meta.env.API_BASE_URL ?? "");
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
};
