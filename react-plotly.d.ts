declare module "react-plotly.js" {
  import type { ComponentType } from "react";

  export interface PlotParams {
    data: ReadonlyArray<object>;
    layout?: object;
    config?: object;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    onClick?: (event: { points?: ReadonlyArray<{ pointNumber?: number }> }) => void;
  }

  const Plot: ComponentType<PlotParams>;
  export default Plot;
}
