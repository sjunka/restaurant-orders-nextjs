"use client";

import { useEffect, useId, useRef } from "react";

interface Props {
  chart: string;
  className?: string;
}

// Renders a Mermaid diagram client-side. Each instance gets a stable unique
// ID so multiple diagrams on the same page don't collide.
export function MermaidChart({ chart, className }: Props) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#fff7ed",
          primaryBorderColor: "#f97316",
          primaryTextColor: "#1f2937",
          lineColor: "#6b7280",
          secondaryColor: "#f0fdf4",
          tertiaryColor: "#eff6ff",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
        },
        er: { diagramPadding: 20 },
        sequence: { diagramMarginX: 10, diagramMarginY: 10 },
      });

      const { svg } = await mermaid.render(`mermaid-${id}`, chart);
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
        // Make the SVG fill its container width
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.style.width = "100%";
          svgEl.style.height = "auto";
          svgEl.removeAttribute("width");
        }
      }
    }

    render().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full overflow-x-auto"}
      aria-label="Architecture diagram"
    />
  );
}
