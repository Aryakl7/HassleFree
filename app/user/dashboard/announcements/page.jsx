// FILE: app/user/dashboard/announcements/page.jsx
'use client'

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, Bell, Info, Megaphone, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Keep if needed for attachments later
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import Cookies from "js-cookie";
// Remove import 'announcement from "@/models/announcement";' - Frontend shouldn't import models
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";

const priorityConfig = {
  low: { icon: Info, color: "bg-blue-500 hover:bg-blue-600" }, // Added hover styles
  medium: { icon: Bell, color: "bg-yellow-500 hover:bg-yellow-600" },
  high: { icon: AlertTriangle, color: "bg-orange-500 hover:bg-orange-600" },
  urgent: { icon: AlertCircle, color: "bg-red-500 hover:bg-red-600" },
};

export default function AnnouncementViewer() {
  const [announcements, setAnnouncements] = useState([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // No longer need socId from cookies for the API call itself
  const accessToken = Cookies.get('UserAccessToken');

  const getAnnouncements = async () => {
    if (!accessToken) {
      setError("User authentication token is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // *** Call the NEW user-specific endpoint ***
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/user/announcements`, {
        headers: {
          Authorization: `Bearer ${accessToken}` // Send USER token
        }
      });
      console.log("User Announcements Response:", res.data);
      setAnnouncements(res.data.announcements || []); // Ensure it's an array
    } catch (err) {
      console.error("Error fetching user announcements:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to fetch announcements.");
      setAnnouncements([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAnnouncements();
  }, []); // Fetch on mount

   // Skeleton Component for Announcements
   const AnnouncementSkeleton = () => (
     <div className="relative space-y-2 ml-6 pb-4">
        <Skeleton className="absolute left-[-1.5rem] w-1 h-full rounded-full bg-muted"/>
        <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-6 w-20 rounded-full ml-auto" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
     </div>
   );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Announcements
        </CardTitle>
        <CardDescription>Stay updated with the latest news and information for your society</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorDisplay title="Error" message={error}/>
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
              <div className="space-y-8">
                  <AnnouncementSkeleton />
                  <AnnouncementSkeleton />
                  <AnnouncementSkeleton />
              </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-8">
              {announcements.map((announcement, index) => {
                const config = priorityConfig[announcement.priority] || priorityConfig.medium;
                const PriorityIcon = config.icon;
                return (
                  <div key={announcement._id} className="relative">
                    {/* Priority Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.color} rounded-full`}/>

                    <div className="ml-6"> {/* Content indented */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Title and Priority Icon */}
                        <div className="flex items-center gap-2">
                             <PriorityIcon className={`h-5 w-5 ${config.color.split(' ')[0].replace('bg','text')}`} /> {/* Use text color */}
                             <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        </div>
                        {/* Priority Badge */}
                        <Badge variant="outline" className={`ml-auto ${config.color} text-white border-none capitalize`}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-3">{announcement.description}</p>
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Posted by: {announcement.adminId?.name || 'Admin'}</span> {/* Requires population */}
                        <span>{format(new Date(announcement.createdAt), "MMM d, yyyy 'at' p")}</span>
                      </div>
                      {/* Attachments (Optional Button) */}
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <div className="mt-3">
                          {/* TODO: Implement logic to view/download attachments */}
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => alert('Attachment viewing not implemented')}>
                            <Paperclip className="h-3 w-3 mr-1" />
                            {announcement.attachments.length} Attachment{announcement.attachments.length > 1 ? "s" : ""}
                          </Button>
                        </div>
                      )}
                    </div>
                     {/* Separator */}
                     {index < announcements.length - 1 && <Separator className="my-6 ml-6"/>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
              No announcements found for you at this time.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}