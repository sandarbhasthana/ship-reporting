import { lazy, Suspense } from "react";
import { Spin } from "antd";

// Lazy load the Line chart from @ant-design/charts
// This ensures the heavy charts library is only loaded when actually needed
const Line = lazy(() =>
  import("@ant-design/charts").then((module) => ({ default: module.Line }))
);

// Loading placeholder for chart
const ChartLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      minHeight: 200
    }}
  >
    <Spin size="default" />
  </div>
);

// Props type - matches @ant-design/charts Line component props
// Using 'any' here to avoid importing heavy type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LineChartProps = any;

/**
 * Lazy-loaded Line Chart component
 * Wraps @ant-design/charts Line with React.lazy for code splitting
 * The charts library (~1.2MB) will only be downloaded when this component renders
 */
export const LazyLineChart = (props: LineChartProps) => {
  return (
    <Suspense fallback={<ChartLoader />}>
      <Line {...props} />
    </Suspense>
  );
};

export default LazyLineChart;

