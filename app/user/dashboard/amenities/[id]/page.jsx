// FILE: app/user/dashboard/amenities/[id]/page.jsx
'use client'

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Users, DollarSign, Star, CalendarIcon, QrCode } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// --- Time Selector Component ---
const TimeSelector = ({ label, value, onChange, disabled = false }) => (
    <div className="space-y-1">
      <Label htmlFor={`${label.toLowerCase().replace(' ','-')}-hour`} className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-2">
        <Select value={value.hour} onValueChange={(newHour) => onChange({ ...value, hour: newHour })} disabled={disabled}>
          <SelectTrigger id={`${label.toLowerCase().replace(' ','-')}-hour`} className="w-[70px] h-9 text-sm"><SelectValue placeholder="HH" /></SelectTrigger>
          <SelectContent>{Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={value.minute} onValueChange={(newMinute) => onChange({ ...value, minute: newMinute })} disabled={disabled}>
          <SelectTrigger className="w-[70px] h-9 text-sm"><SelectValue placeholder="MM" /></SelectTrigger>
          <SelectContent>{['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={value.period} onValueChange={(newPeriod) => onChange({ ...value, period: newPeriod })} disabled={disabled}>
          <SelectTrigger className="w-[70px] h-9 text-sm"><SelectValue placeholder="AM/PM" /></SelectTrigger>
          <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  );

// --- Review Dialog Component ---
function ReviewDialog({ amenityId, triggerButtonText = "Add Review", onReviewAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 0, review: '' });
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const token = Cookies.get('UserAccessToken');

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setError(null);
        if (reviewData.rating < 1 || reviewData.rating > 5) { setError("Please select a rating between 1 and 5."); return; }
        setIsSubmitting(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities/rating`, { ...reviewData, amenityId }, { headers: { Authorization: `Bearer ${token}` } });
            toast({ title: "Success", description: "Review submitted!" });
            setReviewData({ rating: 0, review: '' }); setIsOpen(false); if (onReviewAdded) onReviewAdded();
        } catch (err) {
             const errorMsg = err.response?.data?.error || "Could not submit your review."; setError(errorMsg); toast({ title: "Error", description: errorMsg, variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="outline">{triggerButtonText}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Review Amenity</DialogTitle><DialogDescription>Share your experience.</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmitReview} id={`review-form-${amenityId}`}>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-center space-x-1"><Label className="sr-only">Rating</Label>{[1, 2, 3, 4, 5].map(star => (<button type="button" key={star} onClick={() => setReviewData({...reviewData, rating: star})} aria-label={`Rate ${star} stars`}><Star className={cn("h-8 w-8 cursor-pointer transition-colors", reviewData.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-300")}/></button>))}</div>
                        <div className="space-y-1"><Label htmlFor={`review-comment-${amenityId}`}>Comment (Optional)</Label><Textarea id={`review-comment-${amenityId}`} value={reviewData.review} onChange={e => setReviewData({...reviewData, review: e.target.value})} placeholder="Describe your experience..."/></div>
                    </div>
                     <ErrorDisplay title="Submission Error" message={error} />
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" form={`review-form-${amenityId}`} disabled={isSubmitting || reviewData.rating === 0}>
                         {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null} Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main Page Component ---
export default function UserAmenityDetailPage() {
  const [amenity, setAmenity] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState({ hour: "09", minute: "00", period: "AM" });
  const [endTime, setEndTime] = useState({ hour: "10", minute: "00", period: "AM" });
  const [guests, setGuests] = useState(1);
  const [bookingQrCode, setBookingQrCode] = useState(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const id = pathname?.split("/").pop();
  const accessToken = Cookies.get('UserAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchAmenityAndReviews = async () => {
    if (!id || !accessToken) { setFetchError("Missing amenity ID or user authentication."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    try {
        console.log(`[User Amenity Detail] Fetching amenity ${id}`);
        const amenityRes = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        setAmenity(amenityRes.data);

        console.log(`[User Amenity Detail] Fetching reviews for amenity ${id}`);
        const reviewsRes = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities/rating?amenityId=${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        setReviews(reviewsRes.data || []);
    } catch (err) {
        console.error("Error fetching amenity/reviews:", err.response?.data || err.message);
        setFetchError(err.response?.data?.message || err.response?.data?.error || "Failed to load details.");
        setAmenity(null); setReviews([]);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (id) { fetchAmenityAndReviews(); }
    else { setFetchError("Amenity ID not found in URL."); setIsLoading(false); }
  }, [id]); // Re-fetch only if ID changes

  // --- Booking Logic ---
  const convertTo24Hour = (time) => {
      let hours = parseInt(time.hour, 10);
      if (time.period === 'PM' && hours !== 12) hours += 12;
      if (time.period === 'AM' && hours === 12) hours = 0; // Midnight case
      return `${hours.toString().padStart(2, '0')}:${time.minute}`;
  };

  const handleBooking = async () => {
     if (!selectedDate || !startTime || !endTime || !guests || !amenity || !societyId) {
         toast({title: "Missing Info", description:"Cannot proceed with booking. Please ensure all details are selected and you are logged in correctly.", variant:"warning"});
         return;
     };
     const bookingStartTime = convertTo24Hour(startTime);
     const bookingEndTime = convertTo24Hour(endTime);
     if (bookingEndTime <= bookingStartTime) { toast({ title: "Invalid Time", description: "End time must be after start time.", variant: "destructive" }); return; }
     if (guests > amenity.capacity) { toast({ title: "Capacity Exceeded", description: `Max capacity: ${amenity.capacity}.`, variant: "destructive" }); return; }
     if (amenity.status !== 'operational') { toast({ title: "Not Available", description: `Amenity is currently ${amenity.status}.`, variant: "warning" }); return; }

    setIsBooking(true); setBookingError(null);

    const bookingData = {
        amenityId: id, societyId: societyId, bookingDate: format(selectedDate, "yyyy-MM-dd"),
        startTime: bookingStartTime, endTime: bookingEndTime, numberOfPeople: guests,
    };
    console.log("[User Amenity Detail] Submitting booking:", bookingData);

    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings`, bookingData, { headers: { Authorization: `Bearer ${accessToken}` } });
        const newBooking = response.data.booking;
        toast({ title: "Booking Successful!", description: `You've booked ${amenity.name}. Generating QR...` });

        if (newBooking?._id) {
            console.log(`[User Amenity Detail] Generating QR for booking ${newBooking._id}`);
            try {
                 const qrResponse = await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/generate-qr`, { bookingId: newBooking._id }, { headers: { Authorization: `Bearer ${accessToken}` } });
                 setBookingQrCode(qrResponse.data.qrCode); setIsQrDialogOpen(true);
                 console.log("[User Amenity Detail] QR Code generated.");
            } catch (qrError) {
                 console.error("Failed to generate QR Code:", qrError.response?.data || qrError.message);
                 toast({ title: "Booking successful, but QR failed", description: "Could not generate QR code for check-in.", variant: "warning" });
            }
        } else { toast({ title: "Booking successful, ID missing", description: "Booking confirmed but cannot generate QR code.", variant: "warning" }); }
         // Optionally redirect after booking: router.push('/user/dashboard/my-bookings');
    } catch (err) {
        console.error("Booking failed:", err.response?.data || err.message);
        const errorMsg = err.response?.data?.error || "Booking failed. Slot unavailable or server error.";
        setBookingError(errorMsg); toast({ title: "Booking Failed", description: errorMsg, variant: "destructive" });
    } finally { setIsBooking(false); }
  };

   // --- Render Skeletons ---
  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
             <Skeleton className="h-10 w-3/4" /> {/* Title */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                     <Skeleton className="w-full h-64 rounded-lg" /> {/* Image */}
                     <Skeleton className="h-6 w-24 rounded-full" /> {/* Badge */}
                     <Skeleton className="h-4 w-full" /> {/* Description */}
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-5/6" />
                     <div className="grid grid-cols-2 gap-4 pt-4"> {/* Details */}
                          <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-5 w-3/4" />
                     </div>
                     <Skeleton className="h-px w-full" /> {/* Separator */}
                      <Skeleton className="h-6 w-1/4" /> {/* Rules Title */}
                     <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" />
                     <Skeleton className="h-px w-full" /> {/* Separator */}
                      <Skeleton className="h-6 w-1/4" /> {/* Timings Title */}
                     <Skeleton className="h-10 w-full" /> {/* Timings Table Row */}
                     <Skeleton className="h-10 w-full" />
                 </div>
                  <div className="space-y-6">
                     <Skeleton className="w-full h-[550px] rounded-lg"/> {/* Booking Card */}
                  </div>
             </div>
             <Skeleton className="w-full h-[200px] rounded-lg"/> {/* Reviews Card */}
        </div>
    );
  }

  // --- Render Error if amenity failed to load ---
  if (fetchError && !amenity) {
    return <div className="container mx-auto p-8"><ErrorDisplay title="Failed to Load Amenity" message={fetchError} /></div>;
  }

  // --- Render Not Found ---
  if (!amenity) {
     return <div className="container mx-auto p-8 text-center">Amenity details could not be loaded or found.</div>;
  }

  // --- Main Render ---
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{amenity.name}</h1>
      {/* Display booking-specific errors here */}
       <ErrorDisplay title="Booking Error" message={bookingError}/>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Amenity Details Column */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="p-0">
              <Image // Use Next/Image
                src={amenity.photos?.[0]?.url || '/placeholder-amenity.png'} // Use correct placeholder path
                alt={amenity.photos?.[0]?.caption || amenity.name}
                width={800} // Provide appropriate width
                height={400} // Provide appropriate height
                className="w-full h-64 object-cover rounded-t-lg"
                priority // Load main image faster
                 onError={(e) => { if (e.target.src !== '/placeholder-amenity.png') { e.target.onerror = null; e.target.src='/placeholder-amenity.png'; }}}
              />
            </CardHeader>
            <CardContent className="p-6">
                <Badge className="mb-4 capitalize" variant={amenity.status === 'operational' ? 'default' : 'destructive'}>
                    {amenity.status}
                </Badge>
                <p className="text-muted-foreground mb-4">{amenity.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-muted-foreground"><Users className="mr-2 h-4 w-4" />Capacity: {amenity.capacity}</div>
                    <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4" />{amenity.location}</div>
                    <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-4 w-4" />Open: {amenity.timings?.[0]?.openTime || 'N/A'} - {amenity.timings?.[0]?.closeTime || 'N/A'}</div>
                    {amenity.pricing?.isChargeable && (
                    <div className="flex items-center text-muted-foreground"><DollarSign className="mr-2 h-4 w-4" />Hourly: ${amenity.pricing.hourlyRate?.toFixed(2)}</div>
                    )}
                </div>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2">Rules</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground mb-4 pl-4 space-y-1">
                {(amenity.rules || []).map((rule, index) => ( <li key={index}>{rule}</li> ))}
                 {(!amenity.rules || amenity.rules.length === 0) && <li>No specific rules listed.</li>}
              </ul>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2">Timings</h3>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Day</TableHead><TableHead>Open</TableHead>
                        <TableHead>Close</TableHead><TableHead>Maintenance</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(amenity.timings || []).map((timing, index) => (
                        <TableRow key={index}>
                        <TableCell className="capitalize font-medium">{timing.day}</TableCell>
                        <TableCell>{timing.openTime}</TableCell>
                        <TableCell>{timing.closeTime}</TableCell>
                        <TableCell>{timing.maintenanceTime || '-'}</TableCell>
                        </TableRow>
                    ))}
                     {(!amenity.timings || amenity.timings.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Timings not available.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="mt-8 shadow-sm">
             <CardHeader>
                 <CardTitle>Reviews</CardTitle>
                 <CardDescription>{reviews.length > 0 ? `Based on ${reviews.length} review(s).` : 'No reviews yet.'}</CardDescription>
            </CardHeader>
             <CardContent>
                 {reviews.length > 0 ? (
                     reviews.map((review) => (
                     <div key={review._id} className="mb-4 pb-4 border-b last:border-b-0">
                         <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                 {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${review.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />)}
                                 <span className="text-xs text-muted-foreground ml-2">({review.rating})</span>
                              </div>
                              <span className="text-muted-foreground text-xs">{format(new Date(review.createdAt), 'PP')}</span>
                         </div>
                         <p className="text-sm">{review.review || <span className="italic text-muted-foreground">No comment provided.</span>}</p>
                         {/* Optional: Display user name if populated by API */}
                         {/* <p className="text-xs text-muted-foreground mt-1">- {review.userId?.name || 'Resident'}</p> */}
                     </div>
                     ))
                 ) : (
                     <p className="text-sm text-muted-foreground text-center py-4">Be the first to review this amenity!</p>
                 )}
             </CardContent>
             <CardFooter>
               <ReviewDialog amenityId={id} onReviewAdded={fetchAmenityAndReviews} />
             </CardFooter>
          </Card>
        </div>

        {/* Booking Column */}
        <div>
          <Card className="shadow-lg sticky top-8">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="text-xl">Book {amenity.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div>
                    <Label className="text-base font-semibold mb-1 block" htmlFor="booking-date">Select Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="booking-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !selectedDate && "text-muted-foreground")} disabled={isBooking || amenity.status !== 'operational'}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} /></PopoverContent>
                    </Popover>
                </div>
              <div className="grid grid-cols-2 gap-4">
                 <TimeSelector label="Start Time" value={startTime} onChange={setStartTime} disabled={isBooking || amenity.status !== 'operational'}/>
                 <TimeSelector label="End Time" value={endTime} onChange={setEndTime} disabled={isBooking || amenity.status !== 'operational'}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="guests" className="text-base font-semibold">Number of Guests</Label>
                <Input id="guests" type="number" min="1" max={amenity.capacity} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(amenity.capacity, parseInt(e.target.value) || 1)))} className="h-9" disabled={isBooking || amenity.status !== 'operational'}/>
                 <p className="text-xs text-muted-foreground">Max capacity: {amenity.capacity}</p>
              </div>
               {amenity.pricing?.isChargeable && (
                   <div className="pt-2 text-sm border-t mt-2">
                       <p><strong>Note:</strong> This amenity is chargeable.</p>
                       <p>Hourly Rate: ${amenity.pricing.hourlyRate?.toFixed(2)}</p>
                       {/* Add calculation logic if needed */}
                   </div>
               )}
            </CardContent>
            <CardFooter>
              <Button className="w-full text-lg py-3" onClick={handleBooking} disabled={isBooking || amenity.status !== 'operational'}>
                {isBooking ? <LoadingSpinner size={16} className="mr-2"/> : null}
                {amenity.status !== 'operational' ? `Currently ${amenity.status}` : 'Confirm Booking'}
              </Button>
            </CardFooter>
          </Card>

            {/* QR Code Dialog */}
            <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                 <DialogContent className="sm:max-w-xs">
                    <DialogHeader><DialogTitle>Booking Confirmed!</DialogTitle><DialogDescription>Scan QR at amenity check-in.</DialogDescription></DialogHeader>
                    <div className="flex justify-center py-4">
                        {bookingQrCode ? ( <Image src={bookingQrCode} alt="Booking QR Code" width={200} height={200} /> ) : ( <Skeleton className="w-[200px] h-[200px]" /> )}
                    </div>
                     <DialogFooter><Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>Close</Button></DialogFooter>
                 </DialogContent>
            </Dialog>

        </div>
      </div>
    </div>
  )
}