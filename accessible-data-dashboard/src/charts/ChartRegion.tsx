/**
 * Chart-level accessibility layer (design/SPEC.md §4.3–4.5, Phase 3):
 *  - generated long summary → Highcharts accessibility.description (read on entry)
 *  - keyboard: Highcharts point/series navigation (arrows) + Home/End,
 *    PageUp/PageDown, S (series summary), T (table), Enter (drill-down),
 *    Esc (close tooltip, then leave chart), ? (shortcuts)
 *  - tooltips: shown on hover and focus, hoverable (stickOnContact),
 *    dismissible with Esc, mirrored to a polite live region on pointer hover
 *  - optional sonification (Highcharts sonification module)
 * Single-key shortcuts only act while focus is inside the chart (WCAG 2.1.4).
 */
import { useCallback, useEffect, useRef } from 'react';
import { Highcharts, type ChartOptions } from './highcharts';
import { HighchartsView } from './HighchartsView';
import { announce } from '../state/announcer';
import { openShortcuts } from '../components/ShortcutsDialog';
import { Button } from '../components/ui';
import type { Series } from '../data/types';
import { seriesSentence } from '../lib/summarize';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface ChartRegionProps {
  options: ChartOptions;
  title: string;
  description: string;
  renderKey: string;
  height: number;
  /** Source series (same order as chart series) for the S key. */
  series: Series[];
  valueSuffix: string;
  onTable: () => void;
  /** Enter on a focused point: return true if handled (e.g. open drill-down). */
  onEnter?: (point: Highcharts.Point) => boolean;
  /** Describe a point for the hover live-region mirror. */
  describePoint: (point: Highcharts.Point) => string;
  sonify?: boolean;
}

type A11yChart = Highcharts.Chart & { highlightedPoint?: Highcharts.Point; sonify?: (cb?: () => void) => void; sonification?: { isPlaying?: () => boolean; cancel?: () => void } };
type HPoint = Highcharts.Point & { highlight?: () => void };

export function ChartRegion(p: ChartRegionProps) {
  const chartRef = useRef<A11yChart | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const describeRef = useRef(p.describePoint);
  describeRef.current = p.describePoint;

  const options: ChartOptions = Highcharts.merge(p.options, {
    accessibility: {
      description: p.description,
      screenReaderSection: {
        beforeChartFormat: `<p>${esc(p.title)}</p><div>{typeDescription}</div><div>{chartLongdesc}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div><p>Keyboard: Tab into the chart, then use the arrow keys to move between points and series. S reads the series summary, T shows the table, Escape leaves the chart, question mark lists all shortcuts.</p>`,
      },
    },
    sonification: p.sonify ? { duration: 8000, order: 'sequential', defaultInstrumentOptions: { instrument: 'piano', mapping: { pitch: { min: 'c3', max: 'c6' } } } } : undefined,
    plotOptions: {
      series: {
        point: {
          events: {
            // Mirror tooltip content for pointer hover only; keyboard focus already reads the point label.
            mouseOver: function (this: Highcharts.Point) {
              if (wrapRef.current?.contains(document.activeElement)) return;
              announce(describeRef.current(this), 'polite', 400);
            },
          },
        },
      },
    },
  } as ChartOptions) as ChartOptions;

  const onChart = useCallback((c: Highcharts.Chart | null) => { chartRef.current = c as A11yChart | null; }, []);

  // Esc closes a hover tooltip even when focus is elsewhere (1.4.13 dismissible).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = chartRef.current;
      if (e.key === 'Escape' && c?.tooltip && !(c.tooltip as unknown as { isHidden: boolean }).isHidden && !wrapRef.current?.contains(document.activeElement)) c.tooltip.hide(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    const c = chartRef.current;
    if (!c || e.altKey || e.ctrlKey || e.metaKey) return;
    const hp = c.highlightedPoint as HPoint | undefined;
    const pts = hp ? (hp.series.points as HPoint[]).filter((x) => x.y != null) : [];
    const idx = hp ? pts.indexOf(hp) : -1;
    const go = (i: number) => { const t = pts[Math.max(0, Math.min(pts.length - 1, i))]; t?.highlight?.(); };
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    switch (e.key) {
      case 'ArrowUp': case 'ArrowDown': {
        // Same date (x) in the previous/next series; heatmap rows behave the same way.
        if (!hp || c.series.length < 2) break;
        stop();
        const vis = c.series.filter((x) => x.visible && x.points.length);
        const si = vis.indexOf(hp.series) + (e.key === 'ArrowDown' ? 1 : -1);
        if (si < 0 || si >= vis.length) { announce(e.key === 'ArrowDown' ? 'Last series.' : 'First series.', 'polite', 50); break; }
        const target = (vis[si].points as HPoint[]).filter((x) => x.y != null).reduce<HPoint | undefined>((best, x) => (!best || Math.abs((x.x ?? 0) - (hp.x ?? 0)) < Math.abs((best.x ?? 0) - (hp.x ?? 0)) ? x : best), undefined);
        target?.highlight?.();
        break;
      }
      case 'Home': if (hp) { stop(); go(0); } break;
      case 'End': if (hp) { stop(); go(pts.length - 1); } break;
      case 'PageUp': if (hp) { stop(); go(idx - 12); } break;
      case 'PageDown': if (hp) { stop(); go(idx + 12); } break;
      case 's': case 'S': {
        stop();
        const sIdx = hp ? c.series.indexOf(hp.series) : 0;
        const src = p.series[sIdx] ?? p.series[0];
        if (src) announce(seriesSentence(src, p.valueSuffix), 'polite', 50);
        break;
      }
      case 't': case 'T': { stop(); const widget = wrapRef.current?.closest('[data-widget]'); p.onTable(); setTimeout(() => widget?.querySelectorAll<HTMLElement>('.view-toggle__btn')[1]?.focus(), 50); break; }
      case '?': stop(); openShortcuts(); break;
      case 'Enter': if (hp && p.onEnter?.(hp)) stop(); break;
      case 'Escape': {
        stop();
        const tip = c.tooltip as unknown as { isHidden: boolean; hide: (d?: number) => void };
        if (tip && !tip.isHidden) { tip.hide(0); announce('Tooltip closed.', 'polite', 50); }
        else wrapRef.current?.closest('[data-widget]')?.querySelector<HTMLElement>('.view-toggle__btn')?.focus();
        break;
      }
    }
  };

  return (
    <div ref={wrapRef} className="chart-region" data-chart-keys onKeyDownCapture={onKeyDownCapture}>
      {p.sonify && (
        <div className="row chart-region__tools">
          <Button variant="secondary" icon="sound" onPress={() => {
            const c = chartRef.current;
            if (!c?.sonify) { announce('Sound playback is not available in this browser.'); return; }
            if (c.sonification?.isPlaying?.()) { c.sonification.cancel?.(); announce('Sound stopped.'); return; }
            announce('Playing the chart as sound: higher pitch means higher inflation. Series play one after another. Press the button again to stop.', 'polite', 0);
            setTimeout(() => c.sonify?.(() => announce('Sound finished.')), 1500);
          }}>Play as sound</Button>
        </div>
      )}
      <HighchartsView options={options} renderKey={p.renderKey} height={p.height} onChart={onChart} />
    </div>
  );
}
