import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        running: "border-transparent bg-status-running/15 text-status-running border-status-running/30",
        alert: "border-transparent bg-status-alert/15 text-status-alert border-status-alert/30",
        quarantined: "border-transparent bg-status-quarantined/15 text-status-quarantined border-status-quarantined/30",
        escalating: "border-transparent bg-status-escalating/15 text-status-escalating border-status-escalating/30",
        failed: "border-transparent bg-status-failed/15 text-status-failed border-status-failed/30",
        success: "border-transparent bg-status-success/15 text-status-success border-status-success/30",
        idle: "border-transparent bg-status-idle/15 text-status-idle border-status-idle/30",
        langchain: "border-transparent bg-framework-langchain/15 text-framework-langchain border-framework-langchain/30",
        autogen: "border-transparent bg-framework-autogen/15 text-framework-autogen border-framework-autogen/30",
        crewai: "border-transparent bg-framework-crewai/15 text-framework-crewai border-framework-crewai/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
