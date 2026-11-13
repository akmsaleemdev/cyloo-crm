import React, { forwardRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Standard enterprise animation timings (milliseconds)
 */
export const MOTION_TIMINGS = {
  instant: 0.1,
  fast: 0.18,
  standard: 0.25,
  smooth: 0.35,
};

export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1], // Fluid decel
  easeInOut: [0.65, 0, 0.35, 1],
  spring: { type: "spring", damping: 25, stiffness: 300 },
  subtleSpring: { type: "spring", damping: 30, stiffness: 260 },
};

/**
 * Page Transition: Subtle fade-in with micro-slide on Y axis
 */
export const PageTransition = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, className, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const variants: Variants = {
      initial: {
        opacity: 0,
        y: shouldReduceMotion ? 0 : 8,
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: shouldReduceMotion ? 0 : MOTION_TIMINGS.standard,
          ease: MOTION_EASINGS.easeOut,
        },
      },
      exit: {
        opacity: 0,
        y: shouldReduceMotion ? 0 : -6,
        transition: {
          duration: shouldReduceMotion ? 0 : MOTION_TIMINGS.fast,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className={cn("w-full h-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
PageTransition.displayName = "PageTransition";

/**
 * MotionCard: Card container with gentle hover elevation & press feedback
 */
export const MotionCard = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { interactive?: boolean }
>(({ children, className, interactive = false, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      whileHover={
        interactive && !shouldReduceMotion
          ? { y: -2, transition: { duration: 0.18, ease: "easeOut" } }
          : undefined
      }
      whileTap={
        interactive && !shouldReduceMotion
          ? { scale: 0.99, transition: { duration: 0.1 } }
          : undefined
      }
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow",
        interactive && "hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});
MotionCard.displayName = "MotionCard";

/**
 * Stagger Container & Items for choreography
 */
export const StaggerContainer: React.FC<HTMLMotionProps<"div"> & { staggerDelay?: number }> = ({
  children,
  className,
  staggerDelay = 0.04,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<HTMLMotionProps<"div">> = ({
  children,
  className,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants: Variants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : MOTION_TIMINGS.standard,
        ease: MOTION_EASINGS.easeOut,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
};

/**
 * Subtle Fade In Wrapper
 */
export const FadeIn: React.FC<HTMLMotionProps<"div"> & { delay?: number; duration?: number }> = ({
  children,
  className,
  delay = 0,
  duration = 0.25,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
