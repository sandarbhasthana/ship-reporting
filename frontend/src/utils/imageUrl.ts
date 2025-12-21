/**
 * Image URL utilities for handling both S3 and local storage paths
 */

// API URL for API calls (includes /api prefix)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
// Base URL for static files (no /api prefix)
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

// Cache for S3 signed URLs to avoid repeated API calls
// Key: S3 path, Value: { url: signed URL, expiry: timestamp }
const signedUrlCache = new Map<string, { url: string; expiry: number }>();

// Cache duration: 50 minutes (signed URLs typically expire in 1 hour)
const CACHE_DURATION_MS = 50 * 60 * 1000;

/**
 * Check if a path is an S3 path (starts with 's3://')
 */
export const isS3Path = (path: string | undefined | null): boolean => {
  return !!path && path.startsWith("s3://");
};

/**
 * Get cached signed URL if available and not expired
 */
const getCachedUrl = (path: string): string | null => {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiry > Date.now()) {
    return cached.url;
  }
  // Remove expired entry
  if (cached) {
    signedUrlCache.delete(path);
  }
  return null;
};

/**
 * Cache a signed URL
 */
const cacheUrl = (path: string, url: string): void => {
  signedUrlCache.set(path, {
    url,
    expiry: Date.now() + CACHE_DURATION_MS
  });
};

/**
 * Get the displayable URL for an image path
 * - For S3 paths: fetches a signed URL from the backend (with caching)
 * - For local paths: prepends the API URL
 * - For full URLs (http/https): returns as-is
 *
 * @param path - The image path (S3 key, local path, or full URL)
 * @returns Promise resolving to the displayable URL
 */
export const getImageUrl = async (
  path: string | undefined | null
): Promise<string | null> => {
  if (!path) return null;

  // If already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // If S3 path, check cache first then fetch signed URL from backend
  if (isS3Path(path)) {
    // Check cache first
    const cachedUrl = getCachedUrl(path);
    if (cachedUrl) {
      return cachedUrl;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/upload/url?path=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Cache the signed URL
        cacheUrl(path, data.url);
        return data.url;
      }
      console.error("Failed to get signed URL:", response.statusText);
      return null;
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      return null;
    }
  }

  // Local path - prepend BASE_URL (static files don't have /api prefix)
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

/**
 * Synchronous version that returns a placeholder for S3 paths
 * Use this when you can't use async (e.g., in render functions)
 * For S3 paths, returns null - use the async version or useImageUrl hook instead
 *
 * @param path - The image path
 * @returns The URL string or null for S3 paths
 */
export const getImageUrlSync = (
  path: string | undefined | null
): string | null => {
  if (!path) return null;

  // If already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // S3 paths need async resolution
  if (isS3Path(path)) {
    return null;
  }

  // Local path - prepend BASE_URL (static files don't have /api prefix)
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
