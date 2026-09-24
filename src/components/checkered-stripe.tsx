const COLUMN_COUNT = 40;

const COLUMNS = Array.from({ length: COLUMN_COUNT }, (_, index) => index);

export function CheckeredStripe() {
  return (
    <svg
      aria-hidden="true"
      className="block aspect-20/1 w-full text-primary"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${COLUMN_COUNT} 2`}
    >
      {COLUMNS.map((column) => (
        <rect key={column} x={column} y={column % 2 === 0 ? 1 : 0} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}
