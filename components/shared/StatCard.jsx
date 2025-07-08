// components/shared/StatCard.jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Example Usage in a parent component:
// <StatCard
//   title="Total Residents"
//   value={stats.users} // Assuming stats.users holds the number or null/undefined if loading
//   icon={<Users className="h-4 w-4 text-muted-foreground" />}
//   description="+5 since last month" // Optional description
//   isLoading={isLoadingStats}
// />

export function StatCard({ title, value, icon, description, isLoading, className }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value ?? '--'}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}