"use client";

/**
 * StackingCards — from design/components/COMPONENT_PROMPTS.md (component 4).
 * Original author: Khoa Phan <https://www.pldkhoa.dev>
 *
 * Kept as supplied, with two changes: it imports `motion/react` (already its
 * import in the source) and it now flattens under prefers-reduced-motion, where
 * the cards stop sticking and scaling and read as a normal list.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { motion, useScroll, useTransform, type MotionValue, type UseScrollOptions } from "motion/react";

import { cn } from "@/lib/utils";

interface StackingCardsProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  scrollOptions?: UseScrollOptions;
  scaleMultiplier?: number;
  totalCards: number;
}

interface StackingCardItemProps extends HTMLAttributes<HTMLDivElement>, PropsWithChildren {
  index: number;
  topPosition?: string;
}

const StackingCardsContext = createContext<{
  progress: MotionValue<number>;
  scaleMultiplier?: number;
  totalCards?: number;
  reduced: boolean;
} | null>(null);

export const useStackingCardsContext = () => {
  const context = useContext(StackingCardsContext);
  if (!context) throw new Error("StackingCardItem must be used within StackingCards");
  return context;
};

export default function StackingCards({
  children,
  className,
  scrollOptions,
  scaleMultiplier,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    ...scrollOptions,
    target: targetRef,
  });

  return (
    <StackingCardsContext.Provider
      value={{ progress: scrollYProgress, scaleMultiplier, totalCards, reduced }}
    >
      <div className={cn(className)} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

const StackingCardItem = ({
  index,
  topPosition,
  className,
  children,
  ...props
}: StackingCardItemProps) => {
  const { progress, scaleMultiplier, totalCards = 0, reduced } = useStackingCardsContext();
  const scaleTo = 1 - (totalCards - index) * (scaleMultiplier ?? 0.03);
  const rangeScale = [index * (1 / totalCards), 1];
  const scale = useTransform(progress, rangeScale, [1, scaleTo]);
  const top = topPosition ?? `${5 + index * 3}%`;

  if (reduced) {
    return (
      <div className={cn("mb-6", className)} {...props}>
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("sticky top-0 h-full", className)} {...props}>
      <motion.div className="relative h-full origin-top" style={{ top, scale }}>
        {children}
      </motion.div>
    </div>
  );
};

export { StackingCardItem };
