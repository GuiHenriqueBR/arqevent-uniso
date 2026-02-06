import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  disableHover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className, 
  disableHover = false,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={!disableHover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
        "dark:bg-gray-800 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
