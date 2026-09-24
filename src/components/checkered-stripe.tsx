"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 40;

// The pattern repeats every 2 columns, so the animation slides the stripe right by 2 and loops. The extra
// columns start off the left edge and slide in to fill the gap.
const PATTERN_WIDTH = 2;

const COLUMNS = Array.from({ length: COLUMN_COUNT + PATTERN_WIDTH }, (_, index) => index);

type CheckeredStripeProps = {
  isAnimating?: boolean;
};

export function CheckeredStripe({ isAnimating = false }: CheckeredStripeProps) {
  const animationRef = useRef<SVGAnimateTransformElement>(null);

  // SVG animations are timed from page load, so one added later would start partway through its loop.
  // Starting it manually makes it begin from the stripe's resting position.
  useEffect(() => {
    if (isAnimating && animationRef.current) {
      animationRef.current.beginElement();
    }
  }, [isAnimating]);

  return (
    <svg
      aria-hidden="true"
      className={cn("block aspect-20/1 w-full", isAnimating ? "text-muted-foreground" : "text-primary")}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${COLUMN_COUNT} 2`}
    >
      <g>
        {COLUMNS.map((column) => (
          <rect
            key={column}
            x={column - PATTERN_WIDTH}
            y={column % 2 === 0 ? 1 : 0}
            width={1}
            height={1}
            fill="currentColor"
          />
        ))}
        {isAnimating ? (
          <animateTransform
            ref={animationRef}
            attributeName="transform"
            begin="indefinite"
            type="translate"
            from="0 0"
            to={`${PATTERN_WIDTH} 0`}
            dur=".2s"
            repeatCount="indefinite"
          />
        ) : null}
      </g>
    </svg>
  );
}
