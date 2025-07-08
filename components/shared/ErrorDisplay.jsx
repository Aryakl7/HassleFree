// components/shared/ErrorDisplay.jsx
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Example Usage:
// {error && <ErrorDisplay title="Loading Failed" message={error} />}

export function ErrorDisplay({ title = "Error", message, className }) {
  if (!message) return null;

  const displayMessage = typeof message === 'string' ? message : (message.message || "An unknown error occurred.");

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
}