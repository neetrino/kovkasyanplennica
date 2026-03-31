'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { FIGMA_FLOOR_PLAN_HEIGHT_PX, FIGMA_FLOOR_PLAN_WIDTH_PX } from './figmaFloorPlan.dimensions';
import { FigmaFloorPlan, type FigmaFloorPlanProps } from './figmaFloorPlan.layer';

/**
 * Պահում է Figma-ի ֆիքսված կոորդինատները, սակայն scale-ով տեղավորում է տողի լայնության մեջ
 * առանց հորիզոնական scroll-ի։
 */
export function ScaledFigmaFloorPlan(props: FigmaFloorPlanProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const updateScale = () => {
      const widthPx = host.getBoundingClientRect().width;
      const next = widthPx >= FIGMA_FLOOR_PLAN_WIDTH_PX ? 1 : widthPx / FIGMA_FLOOR_PLAN_WIDTH_PX;
      setScale(next > 0 && Number.isFinite(next) ? next : 1);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const scaledWidth = FIGMA_FLOOR_PLAN_WIDTH_PX * scale;
  const scaledHeight = FIGMA_FLOOR_PLAN_HEIGHT_PX * scale;

  return (
    <div ref={hostRef} className="w-full overflow-x-hidden pb-4">
      <div
        className="mx-auto overflow-hidden"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="origin-top-left"
          style={{
            width: FIGMA_FLOOR_PLAN_WIDTH_PX,
            height: FIGMA_FLOOR_PLAN_HEIGHT_PX,
            transform: `scale(${scale})`,
          }}
        >
          <FigmaFloorPlan {...props} />
        </div>
      </div>
    </div>
  );
}
