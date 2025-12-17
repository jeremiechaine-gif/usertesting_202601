import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxWithIndeterminateProps extends React.ComponentProps<typeof Checkbox> {
  indeterminate?: boolean
}

const CheckboxWithIndeterminate = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxWithIndeterminateProps
>(({ className, indeterminate, checked, ...props }, ref) => {
  return (
    <div className="relative">
      <Checkbox
        ref={ref}
        checked={indeterminate ? false : checked}
        className={cn(className)}
        {...props}
      />
      {indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Minus className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </div>
  )
})
CheckboxWithIndeterminate.displayName = "CheckboxWithIndeterminate"

export { CheckboxWithIndeterminate }

