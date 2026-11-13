import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { marketingReveal } from "@/lib/marketing/motion";
import { Button } from "@/components/ui/button";

export const MarketingButton = motion.create(Button);

/** Reveal once, with content immediately available for users who reduce motion. */
export function MarketingReveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={marketingReveal}
    >
      {children}
    </motion.div>
  );
}
