// FILE: app/user/dashboard/complaints/page.jsx
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StarIcon, AlertCircle, CheckCircle2, Clock, HardHat, X } from "lucide-react"; // Added X for close
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns'; // For date formatting
import { useToast } from '@/hooks/use-toast'; // For notifications

// --- Constants ---
const categories = [
  'electrical', 'plumbing', 'carpentry', 'housekeeping', 'security', 'lift',
  'parking', 'noise', 'pest_control', 'common_area', 'garden', 'gymnasium',
  'swimming_pool', 'other'
];
const priorities = ['low', 'medium', 'high', 'emergency'];

const statusConfig = { // Moved from admin page, now shared
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
  assigned: { icon: HardHat, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
  'in-progress': { icon: HardHat, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700" },
  material_needed: { icon: AlertCircle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
  resolved: { icon: CheckCircle2, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700" },
  closed: { icon: CheckCircle2, color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600" }
};
const priorityConfig = {
    low: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
    medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
    high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
    emergency: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700" },
};


// --- Main Page Component ---
export default function UserComplaintsPage() { // Renamed for clarity
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null); // Added error state
  const [newComplaint, setNewComplaint] = useState({
    title: '', category: '', subCategory: '', description: '',
    location: '', priority: 'medium', photos: [] // Added photos for new complaint
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const socId = Cookies.get('SocietyId');
  const accessToken = Cookies.get('UserAccessToken');

  const fetchComplaints = async () => { // Renamed from getComplaints for consistency
    if (!accessToken || !socId) { setError("Auth details missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      // This API should populate assignedWorker.name
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/complaints?societyId=${socId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setComplaints(res.data || []);
    } catch (err) {
      console.error("Fetch complaints error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to fetch complaints.");
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateComplaint = async (complaintId, updateData) => { // Renamed for clarity
    try {
      // This API should handle feedback/resolution updates by user
      await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/complaints?id=${complaintId}`, updateData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      toast({ title: "Success", description: "Complaint updated." });
      fetchComplaints(); // Refresh list
    } catch (err) {
      console.error("Update complaint error:", err.response?.data || err.message);
      toast({ title: "Error", description: "Failed to update complaint.", variant: "destructive" });
    }
  };

  const handleFileNewComplaint = async (e) => { // Renamed for clarity
    e.preventDefault();
    setError(null); // Clear previous form errors
    // TODO: Add form validation here before submitting
    try {
      // This API should handle new complaint creation by user
      const res = await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/complaints?societyId=${socId}`, newComplaint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setComplaints(prev => [res.data.complaint, ...prev]); // Add to top of list for immediate feedback
      setIsAddDialogOpen(false);
      setNewComplaint({ title: '', category: '', subCategory: '', description: '', location: '', priority: 'medium', photos: [] }); // Reset form
      toast({ title: "Success", description: "Complaint filed successfully." });
    } catch (err) {
      console.error("File complaint error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to file complaint."); // Show error in dialog
      toast({ title: "Error", description: "Failed to file complaint.", variant: "destructive" });
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const filteredComplaints = activeTab === 'all'
    ? complaints
    : complaints.filter(c => c.status === activeTab);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Complaints</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setNewComplaint({ title: '', category: '', subCategory: '', description: '', location: '', priority: 'medium', photos: [] }); setError(null); setIsAddDialogOpen(true);}}>File New Complaint</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]"> {/* Slightly wider */}
            <DialogHeader>
              <DialogTitle>File a New Complaint</DialogTitle>
              <DialogDescription>Describe your issue. We'll address it promptly.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFileNewComplaint} id="new-complaint-form">
              <div className="grid gap-4 py-4">
                {/* Form Fields: Title, Category, SubCategory, Description, Location, Priority */}
                {/* Example: Title */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-title" className="text-right">Title</Label>
                  <Input id="new-title" className="col-span-3" value={newComplaint.title} onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})} required />
                </div>
                {/* Category Select */}
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-category" className="text-right">Category</Label>
                  <Select value={newComplaint.category} onValueChange={(value) => setNewComplaint({...newComplaint, category: value})} required>
                    <SelectTrigger id="new-category" className="col-span-3"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                 {/* Sub-Category Input (Optional) */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-subCategory" className="text-right">Sub-Category</Label>
                  <Input id="new-subCategory" className="col-span-3" value={newComplaint.subCategory} onChange={(e) => setNewComplaint({...newComplaint, subCategory: e.target.value})} />
                </div>
                 {/* Description Textarea */}
                <div className="grid grid-cols-4 items-start gap-4"> {/* items-start for textarea */}
                  <Label htmlFor="new-description" className="text-right pt-2">Description</Label>
                  <Textarea id="new-description" className="col-span-3" value={newComplaint.description} onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})} required />
                </div>
                {/* Location Input */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-location" className="text-right">Location</Label>
                  <Input id="new-location" className="col-span-3" value={newComplaint.location} onChange={(e) => setNewComplaint({...newComplaint, location: e.target.value})} required />
                </div>
                {/* Priority Select */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-priority" className="text-right">Priority</Label>
                  <Select value={newComplaint.priority} onValueChange={(value) => setNewComplaint({...newComplaint, priority: value})} defaultValue="medium">
                    <SelectTrigger id="new-priority" className="col-span-3"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>{priorities.map((p) => (<SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                {/* TODO: Photo Upload (Simplified for now, add CloudinaryUploadButton later if needed) */}
                 {/* <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="new-photos" className="text-right">Photos (URLs)</Label><Input id="new-photos" className="col-span-3" placeholder="Optional: url1, url2" onChange={(e) => setNewComplaint({...newComplaint, photos: e.target.value.split(',').map(url=>url.trim()).filter(Boolean)})} /></div> */}
              </div>
              {error && <p className="text-sm text-red-500 mb-2 px-1">{error}</p>}
            </form>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" form="new-complaint-form">Submit Complaint</Button> {/* Triggers form submission */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4"> {/* Adjusted grid cols if needed */}
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0"><ComplaintsList complaints={complaints} updateComplaint={handleUpdateComplaint} /></TabsContent>
        <TabsContent value="pending" className="mt-0"><ComplaintsList complaints={complaints.filter(c => c.status === 'pending')} updateComplaint={handleUpdateComplaint} /></TabsContent>
        <TabsContent value="in-progress" className="mt-0"><ComplaintsList complaints={complaints.filter(c => c.status === 'in-progress')} updateComplaint={handleUpdateComplaint} /></TabsContent>
        <TabsContent value="resolved" className="mt-0"><ComplaintsList complaints={complaints.filter(c => c.status === 'resolved')} updateComplaint={handleUpdateComplaint} /></TabsContent>
        <TabsContent value="closed" className="mt-0"><ComplaintsList complaints={complaints.filter(c => c.status === 'closed')} updateComplaint={handleUpdateComplaint} /></TabsContent>
      </Tabs>
      {isLoading && <p className="text-center text-muted-foreground mt-4">Loading complaints...</p>}
      {!isLoading && complaints.length === 0 && activeTab === 'all' && <p className="text-center text-muted-foreground mt-4">You haven't filed any complaints yet.</p>}
    </div>
  )
}

// --- ComplaintsList Component ---
function ComplaintsList({ complaints, updateComplaint }) {
  if (complaints.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No complaints in this category.</p>
  }
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"> {/* Layout for cards */}
      {complaints.map((complaint) => (
        <ComplaintCard key={complaint._id} complaint={complaint} updateComplaint={updateComplaint} />
      ))}
    </div>
  )
}

// --- ComplaintCard Component ---
function ComplaintCard({ complaint, updateComplaint }) {
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [resolutionText, setResolutionText] = useState(''); // For user resolution if they can mark as resolved
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const { toast } = useToast();

  const CurrentStatusIcon = statusConfig[complaint.status]?.icon || Clock;
  const currentStatusColor = statusConfig[complaint.status]?.color || statusConfig.pending.color;
  const currentPriorityColor = priorityConfig[complaint.priority]?.color || priorityConfig.medium.color;

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedback.rating < 1 || feedback.rating > 5) {
      toast({ title: "Invalid Rating", description: "Please select a rating (1-5 stars).", variant: "destructive" });
      return;
    }
    updateComplaint(complaint._id, { feedback });
    setFeedback({ rating: 0, comment: '' }); // Reset feedback form
  };

  const handleUserMarkResolved = (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
         toast({ title: "Resolution Note Required", description: "Please describe how the issue was resolved.", variant: "destructive"});
        return;
    }
    updateComplaint(complaint._id, { status: 'resolved', resolution: resolutionText }); // User sets to resolved
    setIsResolutionDialogOpen(false);
    setResolutionText('');
  };

  return (
    <Card className="flex flex-col"> {/* Ensure card can grow */}
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight">{complaint.title}</CardTitle>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={`${currentPriorityColor} border-current capitalize text-xs px-2 py-0.5`}>{complaint.priority}</Badge>
            <Badge variant="outline" className={`${currentStatusColor} border-none text-xs px-2 py-0.5`}>
              <CurrentStatusIcon className="h-3 w-3 mr-1" />
              {complaint.status?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Category: {complaint.category?.replace('_', ' ')} {complaint.subCategory && `- ${complaint.subCategory}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"> {/* Allow content to grow */}
        <p className="mb-2 text-sm">{complaint.description}</p>
        <p className="text-xs text-muted-foreground">Location: {complaint.location}</p>
        <Accordion type="single" collapsible className="mt-3 w-full">
          <AccordionItem value="details" className="border-b-0"> {/* Remove border if it's the only item */}
            <AccordionTrigger className="text-xs py-2 hover:no-underline">View More Details</AccordionTrigger>
            <AccordionContent className="text-xs space-y-1 pt-2">
              <p><strong>Created:</strong> {format(new Date(complaint.createdAt), 'PPp')}</p>
              <p><strong>Last Updated:</strong> {format(new Date(complaint.updatedAt), 'PPp')}</p>
              {/* *** CORRECTED TO ACCESS NAME *** */}
              {complaint.assignedWorker && <p><strong>Assigned Worker:</strong> {complaint.assignedWorker?.name || complaint.assignedWorker}</p>}
              {complaint.resolution && (<div><strong>Resolution:</strong> <p className="pl-2 text-muted-foreground whitespace-pre-wrap">{complaint.resolution}</p></div>)}
              {complaint.feedback?.rating > 0 && (
                <div>
                  <strong>Your Feedback:</strong>
                  <div className="flex items-center pl-2">
                    {[...Array(5)].map((_, i) => (<StarIcon key={`f-star-${i}`} className={`w-4 h-4 ${i < complaint.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />))}
                    <span className="ml-1.5 text-xs">({complaint.feedback.rating}/5)</span>
                  </div>
                  {complaint.feedback.comment && <p className="pl-2 text-muted-foreground italic text-xs">"{complaint.feedback.comment}"</p>}
                </div>
              )}
              {/* TODO: Photo display */}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="mt-auto pt-3">
        {/* Feedback Form for Resolved/Closed by USER */}
        {['resolved', 'closed'].includes(complaint.status) && !complaint.feedback?.rating && (
          <form onSubmit={handleFeedbackSubmit} className="w-full space-y-2">
            <Label className="text-sm font-medium">Rate Service:</Label>
            <div className="flex items-center space-x-1 mb-1">
              {[1,2,3,4,5].map((star) => (
                <button key={`rate-${star}`} type="button" onClick={() => setFeedback({ ...feedback, rating: star })}>
                  <StarIcon className={`w-5 h-5 cursor-pointer ${feedback.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                </button>
              ))}
            </div>
            <Textarea placeholder="Optional: Add a comment..." value={feedback.comment} onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })} className="text-sm"/>
            <Button type="submit" size="sm" className="w-full">Submit Feedback</Button>
          </form>
        )}
        {/* User marks as Resolved (if status is in-progress or assigned) */}
        {['assigned', 'in-progress'].includes(complaint.status) && (
             <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">Mark as Resolved by You</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Complaint Resolved</DialogTitle>
                        <DialogDescription>Please describe how the issue was resolved from your end.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUserMarkResolved} id={`user-resolve-form-${complaint._id}`}>
                        <Textarea
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="E.g., Plumber fixed the leak, issue is resolved."
                            className="min-h-[80px] my-4"
                            required
                        />
                    </form>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResolutionDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" form={`user-resolve-form-${complaint._id}`}>Confirm Resolved</Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
        )}
      </CardFooter>
    </Card>
  )
}