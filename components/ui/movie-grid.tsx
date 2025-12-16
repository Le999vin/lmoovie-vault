"use client";

import { Children } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type MovieGridProps = {
  children: React.ReactNode;
};

export function MovieGrid({ children }: MovieGridProps) {
  const prefersReduced = useReducedMotion();
  const items = Children.toArray(children);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {items.map((child, index) => {
          const key = (child as { key?: string | number })?.key ?? index;
          return (
          <motion.div
            key={key as number | string}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: prefersReduced ? 0 : index * 0.03, duration: 0.24, ease: "easeOut" }}
          >
            {child}
          </motion.div>
        );
        })}
      </AnimatePresence>
    </div>
  );
}
