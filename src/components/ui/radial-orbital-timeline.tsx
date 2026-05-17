"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  onSelect?: (id: number, title: string) => void;
}

export default function RadialOrbitalTimeline({
  timelineData,
  onSelect,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;
    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => (prev + 0.3) % 360);
      }, 50);
    }
    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed": return "text-forest border-forest bg-forest/10";
      case "in-progress": return "text-gold border-gold bg-gold/10";
      case "pending": return "text-ink-muted border-border bg-paper";
      default: return "";
    }
  };

  return (
    <div
      className="w-full h-[600px] flex items-center justify-center bg-transparent overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-forest via-gold to-oxblood animate-pulse flex items-center justify-center z-10 shadow-[0_0_20px_var(--color-gold)]">
             <div className="absolute w-20 h-20 rounded-full border border-gold/30 animate-ping opacity-70"></div>
             <div className="absolute w-24 h-24 rounded-full border border-gold/10 animate-ping opacity-50" style={{ animationDelay: "0.5s" }}></div>
             <div className="w-6 h-6 rounded-full bg-background backdrop-blur-md"></div>
          </div>

          <div className="absolute w-[400px] h-[400px] rounded-full border border-border"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""}`}
                  style={{
                    background: `radial-gradient(circle, rgba(179,139,77,0.2) 0%, transparent 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform
                    ${isExpanded ? "bg-gold text-ink border-gold shadow-[0_0_15px_var(--color-gold)] scale-150" 
                      : isRelated ? "bg-paper text-gold border-gold animate-pulse" 
                      : "bg-paper text-ink-muted border-border"}
                  `}
                >
                  <Icon size={16} />
                </div>

                <div className={`absolute top-12 whitespace-nowrap text-xs font-sans uppercase tracking-widest transition-all duration-300 ${isExpanded ? "text-gold scale-125 font-bold" : "text-ink-muted"}`}>
                  {item.title}
                </div>

                {isExpanded && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-paper/95 backdrop-blur-lg border border-border shadow-2xl overflow-visible p-4 rounded z-50">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-border"></div>
                    <div className="flex justify-between items-center mb-2">
                       <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-sans border rounded ${getStatusStyles(item.status)}`}>
                         {item.status.replace("-", " ")}
                       </span>
                       <span className="text-[10px] font-mono text-ink-muted">{item.date}</span>
                    </div>
                    <div className="font-display text-xl text-ink mb-2">{item.title}</div>
                    <p className="text-xs font-serif text-ink-muted mb-4 leading-relaxed">{item.content}</p>

                    <button 
                      onClick={() => onSelect?.(item.id, item.title)}
                      className="w-full py-2 bg-forest text-primary-foreground text-[10px] uppercase tracking-widest font-sans hover:bg-forest-deep transition mb-4 flex items-center justify-center gap-2"
                    >
                      Study Archive <ArrowRight size={12} />
                    </button>

                    <div className="pt-3 border-t border-border">
                       <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-sans text-ink-muted mb-1">
                         <span className="flex items-center gap-1"><Zap size={10} className="text-gold"/> Difficulty</span>
                         <span>{item.energy}%</span>
                       </div>
                       <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                         <div className="h-full bg-gold" style={{ width: `${item.energy}%` }}></div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
