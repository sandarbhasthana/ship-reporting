import React from "react";

interface DeleteIconProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Custom delete/trash icon SVG component
 * Used sitewide for all delete actions
 * Styled to match Ant Design icon structure
 */
export const DeleteIcon: React.FC<DeleteIconProps> = ({ style, className }) => (
  <span
    role="img"
    aria-label="delete"
    className={`anticon ${className || ""}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
      ...style
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -30 552 552"
      width="1em"
      height="1em"
      fill="currentColor"
      style={{ display: "block" }}
    >
      <path
        fillRule="evenodd"
        d="M170.8 14.221A14.21 14.21 0 0 1 185 .014L326.991.006a14.233 14.233 0 0 1 14.2 14.223v35.117H170.8zm233.461 477.443a21.75 21.75 0 0 1-21.856 20.33H127.954a21.968 21.968 0 0 1-21.854-20.416L84.326 173.06H427.5l-23.234 318.6zm56.568-347.452H51.171v-33A33.035 33.035 0 0 1 84.176 78.2l343.644-.011a33.051 33.051 0 0 1 33 33.02v33zm-270.79 291.851a14.422 14.422 0 1 0 28.844 0V233.816a14.42 14.42 0 0 0-28.839-.01v202.257zm102.9 0a14.424 14.424 0 1 0 28.848 0V233.816a14.422 14.422 0 0 0-28.843-.01z"
      />
    </svg>
  </span>
);

export default DeleteIcon;
