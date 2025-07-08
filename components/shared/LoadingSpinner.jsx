// components/shared/LoadingSpinner.jsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Example Usage:
// {isLoading && <LoadingSpinner size={24} />}
// <Button disabled={isLoading}>{isLoading && <LoadingSpinner size={16} className="mr-2" />} Submit</Button>

export function LoadingSpinner({ size = 24, className, ...props }) {
  return (
    <Loader2
      className={cn("animate-spin", className)}
      size={size}
      {...props}
    />
  );
}