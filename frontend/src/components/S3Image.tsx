/**
 * S3Image Component
 * Handles both S3 and local image paths with automatic URL resolution
 */

import { Spin } from "antd";
import { useImageUrl } from "../hooks";

interface S3ImageProps {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  width?: number | string;
  height?: number | string;
}

/**
 * Image component that handles both S3 (s3://) and local paths
 * Automatically fetches signed URLs for S3 paths
 */
export const S3Image: React.FC<S3ImageProps> = ({
  src,
  alt = "",
  className,
  style,
  fallback,
  width,
  height
}) => {
  const { url, loading } = useImageUrl(src);

  if (loading) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width,
          height
        }}
      >
        <Spin size="small" />
      </div>
    );
  }

  if (!url) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      style={{ ...style, width, height }}
    />
  );
};

export default S3Image;

