'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import apiClient from '@/lib/api-client';
import type { BarChartFilters, BubbleChartResult, CompanyHierarchyNode } from '@/types/api';

interface Props { filters: BarChartFilters; }
type PackedNode = d3.HierarchyCircularNode<CompanyHierarchyNode>;

export default function DashboardCompanyBubbleChart({ filters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const focusedCodeRef = useRef('ROOT');
  const [data, setData] = useState<BubbleChartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; maxX: number; node: CompanyHierarchyNode } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post<BubbleChartResult>('/api/dashboard/bubblechart', { filter: filters });
      focusedCodeRef.current = 'ROOT';
      setTooltip(null);
      setData(response.data);
    } catch {
      setError('Unable to load the company hierarchy.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!data?.total || !svgRef.current || !containerRef.current) return;

    const svgElement = svgRef.current;
    const container = containerRef.current;

    const draw = () => {
      const width = Math.max(520, container.clientWidth);
      const height = width;
      const color = d3.scaleLinear<string>()
        .domain([0, 5])
        .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
        .interpolate(d3.interpolateHcl);

      const root = d3.pack<CompanyHierarchyNode>()
        .size([width, height])
        .padding(3)(
          d3.hierarchy(data.hierarchy)
            .sum((node) => node.value || 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
        );

      const svg = d3.select(svgElement);
      svg.selectAll('*').remove();
      svg
        .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', color(0))
        .style('cursor', 'pointer');

      const node = svg.append('g')
        .selectAll<SVGCircleElement, PackedNode>('circle')
        .data(root.descendants().slice(1))
        .join('circle')
        .attr('fill', (item) => item.children ? color(item.depth) : '#fff')
        .attr('fill-opacity', (item) => item.data.matched === false ? 0.34 : 1)
        .attr('stroke', (item) => item.data.matched === false ? 'rgba(42,82,94,.62)' : null)
        .attr('stroke-width', (item) => item.data.matched === false ? 1.2 : null)
        .attr('stroke-dasharray', (item) => item.data.matched === false ? '4 3' : null)
        .attr('pointer-events', (item) => item.children ? null : 'none')
        .attr('data-company-code', (item) => item.data.code)
        .attr('data-parent-code', (item) => item.parent?.data.code ?? '')
        .on('mouseover', function() { d3.select(this).attr('stroke', '#000').attr('stroke-width', 1.5); })
        .on('mouseout', function(_, item) {
          d3.select(this)
            .attr('stroke', item.data.matched === false ? 'rgba(42,82,94,.62)' : null)
            .attr('stroke-width', item.data.matched === false ? 1.2 : null);
        })
        .on('mousemove', (event, item) => {
          setTooltip({ x: event.offsetX, y: event.offsetY, maxX: Math.max(10, container.clientWidth - 244), node: item.data });
        })
        .on('mouseleave', () => setTooltip(null));

      const label = svg.append('g')
        .style('font', '10px sans-serif')
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .selectAll<SVGTextElement, PackedNode>('text')
        .data(root.descendants())
        .join('text')
        .style('fill-opacity', (item) => item.parent === root ? 1 : 0)
        .style('display', (item) => item.parent === root ? 'inline' : 'none')
        .style('font-weight', 600)
        .style('paint-order', 'stroke')
        .style('stroke', 'rgba(255,255,255,.82)')
        .style('stroke-width', 2)
        .text((item) => item.data.name);

      let focus = root.descendants().find((item) => item.data.code === focusedCodeRef.current) ?? root;
      let view: [number, number, number] = [focus.x, focus.y, focus.r * 2];

      const zoomTo = (nextView: [number, number, number]) => {
        const scale = width / nextView[2];
        view = nextView;
        label.attr('transform', (item) => `translate(${(item.x - nextView[0]) * scale},${(item.y - nextView[1]) * scale})`);
        node
          .attr('transform', (item) => `translate(${(item.x - nextView[0]) * scale},${(item.y - nextView[1]) * scale})`)
          .attr('r', (item) => item.r * scale);
      };

      const zoom = (event: MouseEvent, nextFocus: PackedNode) => {
        focus = nextFocus;
        focusedCodeRef.current = focus.data.code;
        setTooltip(null);

        const duration = event.altKey ? 7500 : 750;
        svg.transition('zoom')
          .duration(duration)
          .tween('zoom', () => {
            const interpolate = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return (time: number) => zoomTo(interpolate(time) as [number, number, number]);
          });

        label
          .filter(function(item) { return item.parent === focus || this.style.display === 'inline'; })
          .transition('zoom')
          .duration(duration)
          .style('fill-opacity', (item) => item.parent === focus ? 1 : 0)
          .on('start', function(item) { if (item.parent === focus) this.style.display = 'inline'; })
          .on('end', function(item) { if (item.parent !== focus) this.style.display = 'none'; });
      };

      node.on('click', (event, item) => {
        if (focus !== item) {
          zoom(event, item);
          event.stopPropagation();
        }
      });
      svg.on('click', (event) => zoom(event, root));
      zoomTo([focus.x, focus.y, focus.r * 2]);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [data]);

  if (loading) return <Box sx={{ height: 500, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" onClick={() => void load()}>{error} Click to retry.</Alert>;
  if (!data?.total) return <Alert severity="info">No companies match the selected filters.</Alert>;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', minHeight: 500, overflow: 'hidden', borderRadius: 1, mt: 2 }}>
      <Typography variant="caption" sx={{ position: 'absolute', zIndex: 2, left: 12, top: 12, px: 1.25, py: 0.75, bgcolor: 'rgba(255,255,255,.92)', borderRadius: 1, boxShadow: 1, fontWeight: 700 }}>
        {data.total.toLocaleString()} matched {data.total === 1 ? 'company' : 'companies'}
      </Typography>
      <svg ref={svgRef} role="img" aria-label="Zoomable company hierarchy bubble chart" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1' }} />
      <Stack direction="row" spacing={1.5} sx={{ position: 'absolute', left: 12, bottom: 10, px: 1.25, py: 0.75, bgcolor: 'rgba(255,255,255,.88)', borderRadius: 1 }}>
        {[1, 2, 3, 4].map((level) => <Stack key={level} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: ['#bdf3dd', '#83c8ca', '#6096b7', '#57638f'][level - 1] }} /><Typography variant="caption">L{level}</Typography></Stack>)}
      </Stack>
      {tooltip && <Box sx={{ position: 'absolute', pointerEvents: 'none', left: Math.min(tooltip.x + 14, tooltip.maxX), top: Math.max(8, tooltip.y - 55), width: 230, p: 1.25, bgcolor: '#172b4d', color: '#fff', borderRadius: 1, boxShadow: 3, zIndex: 3 }}>
        <Typography variant="subtitle2">{tooltip.node.name}</Typography>
        <Typography variant="caption" component="div">Level {tooltip.node.level}{tooltip.node.matched === false ? ' · Ancestor context' : ' · Matches filters'}</Typography>
        <Typography variant="caption" component="div">{tooltip.node.city}, {tooltip.node.country}</Typography>
        <Typography variant="caption" component="div">Founded {tooltip.node.foundedYear} · {tooltip.node.employees?.toLocaleString()} employees</Typography>
        <Typography variant="caption" component="div">Revenue {tooltip.node.annualRevenue?.toLocaleString()}</Typography>
      </Box>}
    </Box>
  );
}
