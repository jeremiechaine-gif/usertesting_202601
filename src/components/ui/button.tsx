import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-250 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-[3px] border-transparent active:scale-95 rounded-tl-none rounded-tr-[8px] rounded-bl-[8px] rounded-br-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#a8f5c8] text-[#1a1a1a] font-normal hover:bg-[#00332e] hover:text-white focus-visible:border-[#0070f3] disabled:bg-[#E0E0E0] disabled:text-[#999999]",
        accent:
          "bg-[#9dd7f5] text-[#1a1a1a] font-normal hover:bg-[#00332e] hover:text-white focus-visible:border-[#0070f3] disabled:bg-[#E0E0E0] disabled:text-[#999999]",
        secondary:
          "bg-white text-[#1a1a1a] font-normal border border-[#e0e0e0] hover:bg-[#00332e] hover:text-white hover:border-[#00332e] focus-visible:border-[#0070f3] disabled:bg-[#E0E0E0] disabled:text-[#999999] disabled:border-[#e0e0e0]",
        destructive:
          "bg-[#ffb3ba] text-[#1a1a1a] font-normal hover:bg-[#d32f2f] hover:text-white focus-visible:border-[#0070f3] disabled:bg-[#E0E0E0] disabled:text-[#999999]",
        ghost: "hover:bg-accent hover:text-accent-foreground font-normal focus-visible:border-[#0070f3]",
        link: "text-primary underline-offset-4 hover:underline focus-visible:border-[#0070f3] rounded-none border-0",
      },
      size: {
        default: "px-6 py-2.5 h-10",
        sm: "px-4 py-2 h-8 text-sm",
        lg: "px-8 py-3 h-12 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
