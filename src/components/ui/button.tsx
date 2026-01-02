import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useSound } from "@/contexts/SoundContext";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] rounded-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-secondary hover:border-muted-foreground/30",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:opacity-90",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground shadow-sm hover:opacity-90",
        premium: "bg-gradient-to-r from-accent-gold to-accent-purple text-primary-foreground shadow-lg hover:opacity-90",
        glass: "bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 text-foreground",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { playClick } = useSound();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!props.disabled) {
        playClick();
      }
      if (onClick) {
        onClick(e);
      }
    };

    // If asChild, don't add onClick wrapper to avoid double-wrapping
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
