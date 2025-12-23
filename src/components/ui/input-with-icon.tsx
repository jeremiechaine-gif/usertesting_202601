import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputWithIconProps extends React.ComponentProps<typeof Input> {
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, startAdornment, endAdornment, ...props }, ref) => {
    return (
      <div className="relative">
        {startAdornment && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            {startAdornment}
          </div>
        )}
        <Input
          ref={ref}
          className={cn(
            startAdornment && "pl-10",
            endAdornment && "pr-10",
            className
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            {endAdornment}
          </div>
        )}
      </div>
    )
  }
)
InputWithIcon.displayName = "InputWithIcon"

export { InputWithIcon }





