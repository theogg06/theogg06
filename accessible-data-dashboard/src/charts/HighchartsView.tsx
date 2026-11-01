import { useEffect, useMemo, useRef } from 'react';
import { Highcharts, type ChartOptions } from './highcharts';

export interface HighchartsViewProps {
  options: ChartOptions;
  /** Changing this key re-creates the chart (theme/density changes). */
  renderKey: string;
  height: number;
  onChart?: (chart: Highcharts.Chart | null) => void;
  id?: string;
}

/** Content signature: functions are compared by source so identical options built on each render don't re-create the chart. */
function signature(o: unknown): string {
  return JSON.stringify(o, (_k, v) => (typeof v === 'function' ? String(v) : v));
}

/** Thin React wrapper: create when the options' content changes, destroy on unmount. */
export function HighchartsView({ options, renderKey, height, onChart, id }: HighchartsViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(options);
  latest.current = options;
  const onChartRef = useRef(onChart);
  onChartRef.current = onChart;
  const sig = useMemo(() => signature(options), [options]);
  useEffect(() => {
    if (!ref.current) return;
    const o = latest.current;
    const chart = Highcharts.chart(ref.current, { ...o, chart: { ...o.chart, height } });
    onChartRef.current?.(chart);
    // Re-flow on container resize (reflow at zoom / narrow widths).
    const ro = new ResizeObserver(() => chart.reflow());
    ro.observe(ref.current);
    return () => { ro.disconnect(); onChartRef.current?.(null); chart.destroy(); };
  }, [sig, renderKey, height]);
  return <div ref={ref} id={id} className="hc-container" style={{ minHeight: height }} />;
}
