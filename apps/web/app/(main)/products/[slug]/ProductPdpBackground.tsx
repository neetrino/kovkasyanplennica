const PATTERN = {
  tl: '/assets/pdp/bg-pattern-tl.svg',
  tr: '/assets/pdp/bg-pattern-tr.svg',
  bl: '/assets/pdp/bg-pattern-bl.svg',
  br: '/assets/pdp/bg-pattern-br.svg',
} as const;

type PatternLayerProps = {
  src: (typeof PATTERN)[keyof typeof PATTERN];
  wrapClass: string;
  innerClass: string;
};

function PdpPatternLayer({ src, wrapClass, innerClass }: PatternLayerProps) {
  return (
    <div className={wrapClass} style={{ containerType: 'size' }}>
      <div className={innerClass}>
        <div className="relative size-full">
          <img
            src={src}
            alt=""
            className="pointer-events-none absolute inset-0 block size-full max-w-none object-cover"
          />
        </div>
      </div>
    </div>
  );
}

/** Decorative PDP background — layout matches Figma PRODUCT PAGE (479:3612). */
export function ProductPdpBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <PdpPatternLayer
        src={PATTERN.tl}
        wrapClass="absolute flex inset-[-5.39%_39.25%_46.15%_-22.15%] items-center justify-center"
        innerClass="-scale-x-100 flex-none h-[hypot(43.0157cqw,62.4168cqh)] w-[hypot(-56.9843cqw,37.5832cqh)] rotate-[-33.99deg]"
      />
      <PdpPatternLayer
        src={PATTERN.tr}
        wrapClass="absolute flex inset-[-8.79%_-27.7%_67.42%_61.94%] items-center justify-center"
        innerClass="-scale-x-100 flex-none h-[hypot(-96.9563cqw,3.78647cqh)] w-[hypot(-3.04365cqw,-96.2135cqh)] rotate-[87.99deg]"
      />
      <PdpPatternLayer
        src={PATTERN.bl}
        wrapClass="absolute flex inset-[52.77%_-33.4%_-17.24%_42.15%] items-center justify-center"
        innerClass="-scale-x-100 flex-none h-[hypot(-48.0979cqw,57.4976cqh)] w-[hypot(-51.9021cqw,-42.5024cqh)] rotate-[39.61deg]"
      />
      <PdpPatternLayer
        src={PATTERN.br}
        wrapClass="absolute flex inset-[52.77%_42.08%_-17.24%_-33.33%] items-center justify-center"
        innerClass="flex-none h-[hypot(48.0979cqw,57.4976cqh)] w-[hypot(51.9021cqw,-42.5024cqh)] rotate-[-39.61deg]"
      />
    </div>
  );
}
