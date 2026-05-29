import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { FamilyMember } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  Focus, 
  Search, 
  User, 
  X, 
  HelpCircle,
  Eye,
  Info,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen
} from 'lucide-react';

interface FamilyNetworkGraphProps {
  members: FamilyMember[];
  onFocusMember: (id: string) => void;
  focusedMemberId?: string | null;
}

// Define node and link interfaces for the D3 simulation
interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  member: FamilyMember;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  id: string;
  source: string | NetworkNode;
  target: string | NetworkNode;
  type: 'parent' | 'spouse';
  targetRole?: 'father' | 'mother' | 'spouse';
}

export function FamilyNetworkGraph({ members, onFocusMember, focusedMemberId }: FamilyNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Graph controls
  const [showSpouseLinks, setShowSpouseLinks] = useState(true);
  const [showParentLinks, setShowParentLinks] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Update container size dynamically via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Keep a minimum height of 450px and a maximum aspect ratio of 16:9
        const height = Math.max(450, Math.min(600, width * 0.55));
        setDimensions({ width, height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Pre-process nodes and links based on active filters
  const { nodes, links } = useMemo(() => {
    if (members.length === 0) return { nodes: [], links: [] };

    // Create unique copy of nodes to prevent D3 mutation issues across renders
    const nodesList: NetworkNode[] = members.map(m => ({
      id: m.id,
      member: m
    }));

    const linksList: NetworkLink[] = [];

    members.forEach(m => {
      // Parent links (biological lines)
      if (showParentLinks) {
        if (m.motherId && members.some(p => p.id === m.motherId)) {
          linksList.push({
            id: `${m.id}-${m.motherId}-mother`,
            source: m.id,
            target: m.motherId,
            type: 'parent',
            targetRole: 'mother'
          });
        }
        if (m.fatherId && members.some(p => p.id === m.fatherId)) {
          linksList.push({
            id: `${m.id}-${m.fatherId}-father`,
            source: m.id,
            target: m.fatherId,
            type: 'parent',
            targetRole: 'father'
          });
        }
      }

      // Spouse links (dashed marriage lines)
      if (showSpouseLinks) {
        if (m.spouseId && members.some(p => p.id === m.spouseId)) {
          // Store spouse links with sorted coordinates to avoid duplicates
          const pairKey = [m.id, m.spouseId].sort().join('-');
          if (!linksList.some(l => l.id === `${pairKey}-spouse`)) {
            linksList.push({
              id: `${pairKey}-spouse`,
              source: m.id,
              target: m.spouseId,
              type: 'spouse',
              targetRole: 'spouse'
            });
          }
        }
      }
    });

    return { nodes: nodesList, links: linksList };
  }, [members, showSpouseLinks, showParentLinks]);

  // Find the currently selected member details
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedNodeId) || null;
  }, [members, selectedNodeId]);

  // D3 force simulation controller ref
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
  // Easy zoom behavior handler ref
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Initialize and update simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove(); // Reset visual canvas

    // Define marker styles for directed parent arrows
    const defs = svg.append('defs');
    
    // Mother Arrowhead (Pinkish)
    defs.append('marker')
      .attr('id', 'arrow-mother')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24) // Offset so arrow-head stays outside circle node border (r=18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('class', 'fill-pink-400');

    // Father Arrowhead (Placid Blue)
    defs.append('marker')
      .attr('id', 'arrow-father')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('class', 'fill-blue-400');

    // Create container group for all graph elements supporting zoom/pan
    const gContainer = svg.append('g').attr('class', 'chart-content');

    // Setup zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Helper functions for relationship connections transparency/highlighting
    const isNeighborNode = (nodeId: string, centerId: string | null) => {
      if (!centerId) return true;
      if (nodeId === centerId) return true;
      
      // Node is neighbor if there is a link connecting it to centerId
      return links.some((l: NetworkLink) => {
        const sourceId = typeof l.source === 'object' ? (l.source as NetworkNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as NetworkNode).id : l.target;
        return (sourceId === centerId && targetId === nodeId) || (targetId === centerId && sourceId === nodeId);
      });
    };

    const isLinkHighlighted = (link: NetworkLink, centerId: string | null) => {
      if (!centerId) return true;
      const sourceId = typeof link.source === 'object' ? (link.source as NetworkNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as NetworkNode).id : link.target;
      return sourceId === centerId || targetId === centerId;
    };

    // Draw connection lines with explicit types
    const linkSelection = gContainer.append('g')
      .attr('class', 'links-group')
      .selectAll<SVGLineElement, NetworkLink>('line')
      .data(links, (d: any) => d.id)
      .join('line')
      .attr('stroke-width', (d: NetworkLink) => d.type === 'spouse' ? 2 : 1.5)
      .attr('stroke', (d: NetworkLink) => {
        if (d.type === 'spouse') return '#ef4444'; // Red for spouse pairing
        return d.targetRole === 'mother' ? '#f472b6' : '#60a5fa'; // Pink for mom, Blue for dad
      })
      .attr('stroke-dasharray', (d: NetworkLink) => d.type === 'spouse' ? '5,5' : 'none')
      .attr('marker-end', (d: NetworkLink) => {
        if (d.type === 'spouse') return null;
        return d.targetRole === 'mother' ? 'url(#arrow-mother)' : 'url(#arrow-father)';
      })
      .attr('opacity', (d: NetworkLink) => isLinkHighlighted(d, selectedNodeId) ? 0.75 : 0.15);

    // Draw spouse link center heart markers
    const spouseHeartSelection = gContainer.append('g')
      .attr('class', 'spouse-hearts-group')
      .selectAll<SVGTextElement, NetworkLink>('text')
      .data(links.filter((l: NetworkLink) => l.type === 'spouse'), (d: any) => d.id)
      .join('text')
      .text('❤️')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('cursor', 'default')
      .attr('opacity', (d: NetworkLink) => isLinkHighlighted(d, selectedNodeId) ? 0.9 : 0.15);

    // Setup interactive nodes
    const nodeSelection = gContainer.append('g')
      .attr('class', 'nodes-group')
      .selectAll<SVGGElement, NetworkNode>('g')
      .data(nodes, (d: any) => d.id)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('opacity', (d: NetworkNode) => isNeighborNode(d.id, selectedNodeId) ? 1.0 : 0.15)
      .on('click', (event, d: NetworkNode) => {
        event.stopPropagation();
        setSelectedNodeId(prev => prev === d.id ? null : d.id);
      })
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Adding dynamic mouse hover highlighting
    nodeSelection.on('mouseenter', function(event, d: NetworkNode) {
      if (selectedNodeId) return; // Keep clicked focus locks active
      
      // Dim everyone else
      nodeSelection.transition().duration(150)
        .attr('opacity', (n: NetworkNode) => isNeighborNode(n.id, d.id) ? 1 : 0.15);
      
      linkSelection.transition().duration(150)
        .attr('opacity', (l: NetworkLink) => isLinkHighlighted(l, d.id) ? 0.85 : 0.1);

      spouseHeartSelection.transition().duration(150)
        .attr('opacity', (l: NetworkLink) => isLinkHighlighted(l, d.id) ? 0.95 : 0.1);
    });

    nodeSelection.on('mouseleave', function() {
      if (selectedNodeId) return; // Restores only if there is no lock
      
      nodeSelection.transition().duration(150).attr('opacity', 1);
      linkSelection.transition().duration(150).attr('opacity', 0.5);
      spouseHeartSelection.transition().duration(150).attr('opacity', 0.7);
    });

    // 1. Draw outer glowing circles (for highlight focused node)
    nodeSelection.append('circle')
      .attr('r', 21)
      .attr('class', (d: NetworkNode) => {
        if (d.id === selectedNodeId) {
          return 'fill-indigo-400/20 stroke-indigo-500 animate-pulse stroke-[3]';
        }
        return 'fill-transparent stroke-transparent';
      });

    // 2. Draw outer gender and status ring
    nodeSelection.append('circle')
      .attr('r', 18)
      .attr('class', (d: NetworkNode) => {
        let classes = 'stroke-2 ';
        if (d.member.isDeceased) {
          classes += 'stroke-slate-350 dark:stroke-slate-600 stroke-dasharray-[3,3] ';
        } else {
          classes += d.member.gender === 'female' 
            ? 'stroke-pink-500/85 dark:stroke-pink-400 ' 
            : d.member.gender === 'male' 
            ? 'stroke-blue-500/85 dark:stroke-blue-400 ' 
            : 'stroke-teal-500/85 dark:stroke-teal-400 ';
        }
        
        classes += d.member.isDeceased ? 'fill-slate-100 dark:fill-slate-800' : 'fill-white dark:fill-slate-900';
        return classes;
      });

    // 3. Draw inner avatar center fill circle
    nodeSelection.append('circle')
      .attr('r', 14)
      .attr('class', (d: NetworkNode) => {
        if (d.member.isDeceased) return 'fill-slate-200 dark:fill-slate-700';
        
        // Match avatar color hex values
        const col = d.member.avatarColor;
        if (col.startsWith('bg-amber')) return 'fill-amber-100 dark:fill-amber-900/30';
        if (col.startsWith('bg-emerald')) return 'fill-emerald-100 dark:fill-emerald-900/30';
        if (col.startsWith('bg-rose')) return 'fill-rose-100 dark:fill-rose-900/30';
        if (col.startsWith('bg-cyan')) return 'fill-cyan-100 dark:fill-cyan-900/30';
        if (col.startsWith('bg-purple')) return 'fill-purple-100 dark:fill-purple-900/30';
        if (col.startsWith('bg-indigo')) return 'fill-indigo-100 dark:fill-indigo-900/30';
        if (col.startsWith('bg-teal')) return 'fill-teal-100 dark:fill-teal-900/30';
        if (col.startsWith('bg-pink')) return 'fill-pink-100 dark:fill-pink-900/30';
        if (col.startsWith('bg-blue')) return 'fill-blue-100 dark:fill-blue-900/30';
        
        return 'fill-indigo-50 dark:fill-slate-800';
      });

    // 4. Render avatar text initials
    nodeSelection.append('text')
      .text((d: NetworkNode) => d.member.firstName[0])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('class', (d: NetworkNode) => {
        if (d.member.isDeceased) return 'fill-slate-500 dark:fill-slate-400';
        const col = d.member.avatarColor;
        if (col.startsWith('bg-amber')) return 'fill-amber-700 dark:fill-amber-400';
        if (col.startsWith('bg-emerald')) return 'fill-emerald-700 dark:fill-emerald-400';
        if (col.startsWith('bg-rose')) return 'fill-rose-700 dark:fill-rose-400';
        if (col.startsWith('bg-cyan')) return 'fill-cyan-700 dark:fill-cyan-400';
        if (col.startsWith('bg-purple')) return 'fill-purple-700 dark:fill-purple-400';
        if (col.startsWith('bg-indigo')) return 'fill-indigo-700 dark:fill-indigo-400';
        if (col.startsWith('bg-teal')) return 'fill-teal-700 dark:fill-teal-400';
        if (col.startsWith('bg-pink')) return 'fill-pink-700 dark:fill-pink-400';
        if (col.startsWith('bg-blue')) return 'fill-blue-700 dark:fill-blue-400';
        
        return 'fill-indigo-600 dark:fill-indigo-400';
      });

    // 5. If deceased, append a small cross indicator on head
    nodeSelection.filter((d: NetworkNode) => d.member.isDeceased)
      .append('text')
      .text('†')
      .attr('x', 11)
      .attr('y', -11)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('class', 'fill-rose-600 dark:fill-rose-400');

    // 6. Draw name labeling below node
    nodeSelection.append('text')
      .text((d: NetworkNode) => `${d.member.firstName} ${d.member.lastName || ''}`)
      .attr('y', 31)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('class', 'fill-slate-800 dark:fill-slate-200 antialiased')
      .clone(true).lower() // Drop-shadow backing to ensure clear readability on multi-line links
      .attr('stroke', 'var(--background-default, #fff)')
      .attr('class', 'stroke-white dark:stroke-slate-950 stroke-[3] fill-transparent pointer-events-none opacity-90');

    // Create the physics simulation engine
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links)
        .id((d: any) => d.id)
        .distance((d: any) => d.type === 'spouse' ? 60 : 90) // Spouse is tighter, parent is spread
        .strength(1.1)
      )
      .force('charge', d3.forceManyBody().strength(-240).distanceMax(300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', d3.forceCollide().radius(32).strength(0.8))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.08))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.08));

    simulationRef.current = simulation;

    // Simulation ticker updating coordinates
    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d: any) => (d.source as any).x || 0)
        .attr('y1', (d: any) => (d.source as any).y || 0)
        .attr('x2', (d: any) => (d.target as any).x || 0)
        .attr('y2', (d: any) => (d.target as any).y || 0);

      spouseHeartSelection
        .attr('x', (d: any) => {
          const sx = (d.source as any).x || 0;
          const tx = (d.target as any).x || 0;
          return (sx + tx) / 2;
        })
        .attr('y', (d: any) => {
          const sy = (d.source as any).y || 0;
          const ty = (d.target as any).y || 0;
          return (sy + ty) / 2 - 2; // Offset slightly above core link line
        });

      nodeSelection
        .attr('transform', (d: any) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Fit on initialization
    let initialZoomPerformed = false;
    simulation.on('end', () => {
      if (!initialZoomPerformed) {
        fitToScreen(0);
        initialZoomPerformed = true;
      }
    });

    // Double-click canvas to clear focus selection
    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    // Drag-drop physics handlers
    function dragstarted(event: any, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: NetworkNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Hot swap clean up on state changes
    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, selectedNodeId]);

  // Fit camera function centering all family nodes
  const fitToScreen = (duration = 750) => {
    if (!svgRef.current || !zoomBehaviorRef.current || nodes.length === 0) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    
    // Bounds calculations explicitly coerced as double numbers
    const minX = (d3.min(nodes, (d: any) => d.x ?? 0) ?? 0) as number;
    const maxX = (d3.max(nodes, (d: any) => d.x ?? 0) ?? 0) as number;
    const minY = (d3.min(nodes, (d: any) => d.y ?? 0) ?? 0) as number;
    const maxY = (d3.max(nodes, (d: any) => d.y ?? 0) ?? 0) as number;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    
    if (graphWidth === 0 || graphHeight === 0) return;

    const scale = Math.max(0.2, Math.min(1.5, 0.9 / Math.max(graphWidth / dimensions.width, graphHeight / dimensions.height)));
    
    const centerX = minX + graphWidth / 2;
    const centerY = minY + graphHeight / 2;

    const transform = d3.zoomIdentity
      .translate(dimensions.width / 2 - scale * centerX, dimensions.height / 2 - scale * centerY)
      .scale(scale);

    svg.transition()
      .duration(duration)
      .call(zoomBehaviorRef.current.transform, transform);
  };

  // Center on a single node smoothly
  const focusOnNode = (nodeId: string) => {
    if (!svgRef.current || !zoomBehaviorRef.current || nodes.length === 0) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    const scale = 1.0;
    
    const transform = d3.zoomIdentity
      .translate(dimensions.width / 2 - scale * node.x, dimensions.height / 2 - scale * node.y)
      .scale(scale);

    svg.transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, transform);
    
    setSelectedNodeId(nodeId);
  };

  // Pan action controller buttons
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  // Auto-focus when focusedMemberId prop changes (e.g. from the top search bar)
  useEffect(() => {
    if (focusedMemberId && nodes.length > 0) {
      focusOnNode(focusedMemberId);
    }
  }, [focusedMemberId, nodes]);

  return (
    <div id="family-graph-card" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col gap-4 transition-colors">
      
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
          <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500">Graph Database Empty</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            Begin adding direct members to your lineage or import the demo Airtable to project this kinship network.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          
          {/* Graph Core Viewport with Control Overlay */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/65 dark:border-slate-850 rounded-2xl relative overflow-hidden" ref={containerRef}>
            
            {/* Native SVG Element */}
            <svg 
              ref={svgRef} 
              width={dimensions.width} 
              height={dimensions.height}
              className="block select-none focus:outline-none"
            />

            {/* Float Overlay Camera Panel */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 p-2 rounded-xl shadow-xs backdrop-blur-md">
              <button 
                onClick={() => handleZoom(1.3)} 
                title="Zoom In" 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleZoom(0.7)} 
                title="Zoom Out" 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={() => fitToScreen()} 
                title="Fit to Screen" 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800 mt-1"
              >
                <Focus className="w-4 h-4" />
              </button>
            </div>

            {/* Float Filter Checkboxes Bottom-Left */}
            <div className="absolute left-4 bottom-4 flex flex-wrap gap-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 px-3 py-2 rounded-xl shadow-xs backdrop-blur-md text-xs font-semibold text-slate-600 dark:text-slate-350">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 select-none">
                <input 
                  type="checkbox" 
                  checked={showParentLinks} 
                  onChange={(e) => setShowParentLinks(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Parents</span>
              </label>
              
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 select-none">
                <input 
                  type="checkbox" 
                  checked={showSpouseLinks} 
                  onChange={(e) => setShowSpouseLinks(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500"
                />
                <span>Spouse (❤️)</span>
              </label>
            </div>

            {/* Compact Internal Floating Legend Bottom-Right */}
            <div className="absolute right-4 bottom-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 px-3 py-2 rounded-xl shadow-xs backdrop-blur-md text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 max-w-[150px] font-semibold pointer-events-none select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span>Male</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0"></span>
                <span>Female</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-slate-400 border-dashed shrink-0"></span>
                <span>Deceased</span>
              </div>
            </div>

          </div>

          {/* Right Detailed Sidebar for Selected Node - Only rendered when a card is selected */}
          {selectedMember && (
            <div className="w-full lg:w-72 shrink-0 flex flex-col justify-between gap-4 animate-fade-in">
              <div className="flex-1 flex flex-col">
                <div className="p-5 border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/15 dark:bg-indigo-950/20 rounded-2xl flex-1 flex flex-col justify-between h-full" id="graph-sidebar">
                  <div className="space-y-4">
                    {/* Title Bar */}
                    <div className="flex items-start justify-between border-b dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs border ${selectedMember.avatarColor}`}>
                          {selectedMember.firstName[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">
                            {selectedMember.firstName} {selectedMember.lastName || ''}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase font-bold mt-0.5">
                            {selectedMember.gender} • {selectedMember.isDeceased ? 'Deceased' : 'Living'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Fact Sheets */}
                    <div className="space-y-3.5 text-xs">
                      {selectedMember.birthDate && (
                        <div className="flex gap-2 text-slate-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-[10px] uppercase text-slate-400">Lifespan Timeline</p>
                            <p className="font-medium mt-0.5 font-mono">
                              {selectedMember.birthDate} 
                              {selectedMember.isDeceased && selectedMember.deathDate ? ` — ${selectedMember.deathDate}` : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedMember.birthPlace && (
                        <div className="flex gap-2 text-slate-600 dark:text-slate-300 font-mono">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="font-sans">
                            <p className="font-bold text-[10px] uppercase text-slate-400">Provenance / Origins</p>
                            <p className="font-medium mt-0.5">{selectedMember.birthPlace}</p>
                          </div>
                        </div>
                      )}

                      {selectedMember.occupation && (
                        <div className="flex gap-2 text-slate-600 dark:text-slate-300">
                          <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-[10px] uppercase text-slate-400">Occupation</p>
                            <p className="font-medium mt-0.5">{selectedMember.occupation}</p>
                          </div>
                        </div>
                      )}

                      {selectedMember.notes && (
                        <div className="flex gap-2 text-slate-600 dark:text-slate-300 border-t dark:border-slate-800/80 pt-3">
                          <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[10px] uppercase text-slate-400 font-sans">Heritage Notes</p>
                            <p className="text-[11px] italic leading-relaxed text-slate-500 dark:text-slate-400 mt-1">
                              "{selectedMember.notes}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    onClick={() => onFocusMember(selectedMember.id)}
                    className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> Focus on Tree View
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
