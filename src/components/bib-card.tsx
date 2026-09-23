import { ReactNode } from "react";

export const BIB_NUMBER_CLASS_NAME = "text-[44cqi] leading-[normal] font-bold font-stretch-[25%] md:text-[44cqi]";

type BibCardProps = {
  children: ReactNode;
};

export function BibCard({ children }: BibCardProps) {
  return (
    <div className="relative flex flex-col items-center gap-1.5 rounded-xl border-2 border-foreground px-[7cqi] pt-7 pb-4 focus-within:ring-3 focus-within:ring-ring/50">
      <span
        aria-hidden="true"
        className="absolute top-2.5 left-2.5 size-3 rounded-full border-2 border-foreground bg-background"
      />
      <span
        aria-hidden="true"
        className="absolute top-2.5 right-2.5 size-3 rounded-full border-2 border-foreground bg-background"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-2.5 left-2.5 size-3 rounded-full border-2 border-foreground bg-background"
      />
      <span
        aria-hidden="true"
        className="absolute right-2.5 bottom-2.5 size-3 rounded-full border-2 border-foreground bg-background"
      />
      {children}
    </div>
  );
}
