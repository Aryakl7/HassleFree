// components/admin/ComplaintDetailDialog.jsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle, CheckCheck, Clock, HardHat, Wrench as MaterialIcon } from "lucide-react"; // Example icons
import Image from "next/image"; // For photos

// You might want to move statusConfig here or pass it as a prop if it's also used in ManageComplaintsPage
const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
  assigned: { icon: HardHat, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
  'in-progress': { icon: HardHat, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700" },
  material_needed: { icon: MaterialIcon, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
  resolved: { icon: CheckCheck, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700" },
  closed: { icon: CheckCheck, color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600" }
};
const priorityConfig = {
    low: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
    medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
    high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
    emergency: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700" },
};


export function ComplaintDetailDialog({ complaint, isOpen, onOpenChange }) {
  if (!complaint) return null;

  const CurrentStatusIcon = statusConfig[complaint.status]?.icon || PendingIcon;
  const currentStatusColor = statusConfig[complaint.status]?.color || statusConfig.pending.color;
  const currentPriorityColor = priorityConfig[complaint.priority]?.color || priorityConfig.medium.color;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto"> {/* Increased max-width slightly */}
        <DialogHeader>
          <DialogTitle className="text-xl">Complaint Details: {complaint.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">ID: {complaint._id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4 text-sm pr-2"> {/* Reduced gap slightly */}
          {/* Use divs or spans instead of <p> for lines containing block elements like Badge */}
          <div><strong>Filed By User:</strong> {complaint.userId?.name || complaint.userId || 'N/A'}</div>
          <div><strong>Filed At:</strong> {complaint.createdAt ? format(new Date(complaint.createdAt), 'PPp') : 'N/A'}</div>
          <div><strong>Last Updated:</strong> {complaint.updatedAt ? format(new Date(complaint.updatedAt), 'PPp') : 'N/A'}</div>

          {/* CORRECTED LINES for Status and Priority */}
          <div className="flex items-center gap-2">
            <strong>Status:</strong>
            <Badge variant="outline" className={`${currentStatusColor} border-none`}>
                <CurrentStatusIcon className="h-3 w-3 mr-1.5" />
                {complaint.status?.replace('_', ' ') || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <strong>Priority:</strong>
             <Badge variant="outline" className={`${currentPriorityColor} border-current capitalize`}>
                {complaint.priority || 'N/A'}
            </Badge>
          </div>
          {/* END CORRECTION */}

          <div><strong>Category:</strong> {complaint.category?.replace('_', ' ') || 'N/A'}</div>
          {complaint.subCategory && <div><strong>Sub-Category:</strong> {complaint.subCategory}</div>}
          <div><strong>Location:</strong> {complaint.location || 'N/A'}</div>
          <div className="space-y-1">
            <strong>Description:</strong>
            <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description || 'N/A'}</p>
          </div>
          {complaint.assignedWorker && <div><strong>Assigned Worker:</strong> {complaint.assignedWorker?.name || complaint.assignedWorker}</div>}
          {complaint.estimatedCost && <div><strong>Estimated Cost:</strong> ${complaint.estimatedCost}</div>}
          {complaint.actualCost && <div><strong>Actual Cost:</strong> ${complaint.actualCost}</div>}

          {complaint.photos && complaint.photos.length > 0 && (
             <div className="space-y-1">
                 <strong>Photos:</strong>
                 <div className="flex flex-wrap gap-2 mt-1">
                 {complaint.photos.map((photoUrl, index) => (
                     <Image
                        key={index}
                        src={photoUrl}
                        alt={`Complaint photo ${index+1}`}
                        width={80} height={80} // Set appropriate size
                        className="object-cover rounded border aspect-square"
                        onError={(e) => { if (e.target.src !== '/placeholder-image.png') { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}} // Assuming you have placeholder
                    />
                 ))}
                 </div>
             </div>
            )}
          {complaint.resolution && (
            <div className="space-y-1">
                <strong>Resolution:</strong>
                <p className="text-muted-foreground whitespace-pre-wrap">{complaint.resolution}</p>
            </div>
          )}
          {complaint.feedback && (
             <div className="space-y-1">
                 <strong>User Feedback:</strong>
                 <div className="flex items-center">
                    {[...Array(5)].map((_, i) => ( <Star key={`feedback-star-${i}`} className={`w-4 h-4 ${i < complaint.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} /> ))}
                    <span className="ml-2 text-xs">({complaint.feedback.rating}/5)</span>
                 </div>
                 <p className="text-muted-foreground italic">{complaint.feedback.comment || 'No comment left.'}</p>
             </div>
           )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}