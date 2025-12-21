import { useState, useEffect, useMemo } from "react";
import { getImageUrl, isS3Path, getImageUrlSync } from "../utils/imageUrl";

/**
 * React hook for resolving image URLs (supports both S3 and local paths)
 *
 * @param path - The image path (S3 key, local path, or full URL)
 * @returns Object containing the resolved URL and loading state
 */
export const useImageUrl = (
  path: string | undefined | null
): { url: string | null; loading: boolean } => {
  const [url, setUrl] = useState<string | null>(() => {
    // For non-S3 paths, we can resolve synchronously
    if (!isS3Path(path)) {
      return getImageUrlSync(path);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => isS3Path(path));

  useEffect(() => {
    let mounted = true;

    const resolveUrl = async () => {
      if (!path) {
        setUrl(null);
        setLoading(false);
        return;
      }

      // For S3 paths, we need to fetch the signed URL
      if (isS3Path(path)) {
        setLoading(true);
        try {
          const resolvedUrl = await getImageUrl(path);
          if (mounted) {
            setUrl(resolvedUrl);
          }
        } catch (error) {
          console.error("Failed to resolve image URL:", error);
          if (mounted) {
            setUrl(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        // For local paths, resolve synchronously
        setUrl(getImageUrlSync(path));
        setLoading(false);
      }
    };

    resolveUrl();

    return () => {
      mounted = false;
    };
  }, [path]);

  return { url, loading };
};

/**
 * Hook for resolving multiple image URLs at once
 *
 * @param paths - Array of image paths
 * @returns Object containing array of resolved URLs and loading state
 */
export const useImageUrls = (
  paths: (string | undefined | null)[]
): { urls: (string | null)[]; loading: boolean } => {
  // Memoize paths to create a stable dependency for useEffect
  const pathsKey = useMemo(() => JSON.stringify(paths), [paths]);

  const [urls, setUrls] = useState<(string | null)[]>(() =>
    paths.map((p) => (isS3Path(p) ? null : getImageUrlSync(p)))
  );
  const [loading, setLoading] = useState(() => paths.some((p) => isS3Path(p)));

  useEffect(() => {
    let mounted = true;

    const resolveUrls = async () => {
      const currentPaths = JSON.parse(pathsKey) as (
        | string
        | undefined
        | null
      )[];
      const hasS3Paths = currentPaths.some((p) => isS3Path(p));

      if (!hasS3Paths) {
        setUrls(currentPaths.map((p) => getImageUrlSync(p)));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const resolvedUrls = await Promise.all(
          currentPaths.map((p) => getImageUrl(p))
        );
        if (mounted) {
          setUrls(resolvedUrls);
        }
      } catch (error) {
        console.error("Failed to resolve image URLs:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    resolveUrls();

    return () => {
      mounted = false;
    };
  }, [pathsKey]);

  return { urls, loading };
};

export default useImageUrl;
