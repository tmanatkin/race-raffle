import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BIB_NUMBER_CLASS_NAME = "text-[44cqi] leading-[1.1] font-bold font-stretch-[25%] md:text-[44cqi]";

type BibCardProps = {
  children: ReactNode;
  isOnPrimaryBackground?: boolean;
  error?: string;
};

export function BibCard({ children, isOnPrimaryBackground = false, error }: BibCardProps) {
  const holeClassName = cn(
    "absolute size-3 rounded-full border-2",
    isOnPrimaryBackground ? "border-transparent bg-primary" : "border-foreground bg-background"
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-xl border-2 bg-background px-6 pt-7 pb-4 focus-within:ring-3 focus-within:ring-ring/50",
        isOnPrimaryBackground ? "border-transparent" : "border-foreground"
      )}
    >
      <span aria-hidden="true" className={cn(holeClassName, "top-2.5 left-2.5")} />
      <span aria-hidden="true" className={cn(holeClassName, "top-2.5 right-2.5")} />
      <span aria-hidden="true" className={cn(holeClassName, "bottom-2.5 left-2.5")} />
      <span aria-hidden="true" className={cn(holeClassName, "right-2.5 bottom-2.5")} />
      {children}
      {error !== undefined ? (
        <p role="alert" className="min-h-lh text-center text-sm leading-tight font-bold text-balance text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
