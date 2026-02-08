import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

interface MagicCardProps extends HTMLAttributes<HTMLDivElement> {
    gradientColor?: string;
}

const MagicCard = forwardRef<HTMLDivElement, MagicCardProps>(
    ({ className, children, gradientColor = "var(--primary)", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "group relative overflow-hidden rounded-xl border border-white/10 bg-card/30 backdrop-blur-md transition-all duration-300",
                    "hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10",
                    className
                )}
                {...props}
            >
                {/* Hover Gradient Effect */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gradientColor} 0%, transparent 40%)`,
                        zIndex: 0,
                    }}
                />

                {/* Content */}
                <div className="relative z-10 h-full">
                    {children}
                </div>

                {/* Shimmer Border on Hover */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                        backgroundSize: "200% 200%",
                    }}
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>
        );
    }
);

MagicCard.displayName = "MagicCard";

export { MagicCard };
