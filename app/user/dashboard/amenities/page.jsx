'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from "lucide-react"; // Icons for card
import axios from 'axios';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'; // For error display

// Amenity Card Component (keep as defined previously)
function AmenityCard({ amenity }) {
  const statusVariant = amenity.status === 'operational' ? 'default' : (amenity.status === 'maintenance' ? 'secondary' : 'destructive');
  return (
    <Card className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <img
          src={amenity.photos?.[0]?.url || '/placeholder-image.png'} // Add placeholder image to /public
          alt={amenity.photos?.[0]?.caption || amenity.name}
          className="w-full h-48 object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
             <CardTitle className="text-lg font-semibold">{amenity.name}</CardTitle>
             <Badge variant={statusVariant} className="capitalize">{amenity.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{amenity.description}</p>
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center text-sm text-muted-foreground"><Users className="mr-2 h-4 w-4 flex-shrink-0" /><span>Capacity: {amenity.capacity ?? 'N/A'}</span></div>
          <div className="flex items-center text-sm text-muted-foreground"><MapPin className="mr-2 h-4 w-4 flex-shrink-0" /><span>{amenity.location || 'N/A'}</span></div>
           <div className="flex items-center text-sm text-muted-foreground"><Clock className="mr-2 h-4 w-4 flex-shrink-0" /><span>{amenity.timings?.[0]?.openTime || 'N/A'} - {amenity.timings?.[0]?.closeTime || 'N/A'}</span></div>
        </div>
      </CardContent>
      <CardFooter className="p-4 mt-auto">
        {/* Link to the detail page */}
        <Link href={`/user/dashboard/amenities/${amenity._id}`} passHref legacyBehavior>
          <a className="w-full"><Button className="w-full">View Details & Book</Button></a>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Skeleton Card Component (keep as defined previously)
function AmenityCardSkeleton() {
  return (
      <Card className="overflow-hidden flex flex-col">
          <Skeleton className="w-full h-48"/>
          <CardContent className="p-4 flex-grow">
               <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-6 w-20 rounded-full" />
               </div>
               <Skeleton className="h-4 w-full mt-1" />
               <Skeleton className="h-4 w-full mt-1" />
               <Skeleton className="h-4 w-4/5 mt-1" />
               <div className="mt-4 space-y-2">
                   <Skeleton className="h-4 w-1/2" />
                   <Skeleton className="h-4 w-2/3" />
                   <Skeleton className="h-4 w-1/2" />
               </div>
          </CardContent>
          <CardFooter className="p-4 mt-auto">
              <Skeleton className="h-10 w-full" />
          </CardFooter>
      </Card>
  );
}

// Main Page Component
export default function UserAmenitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allAmenities, setAllAmenities] = useState([]);
  const [filteredAmenities, setFilteredAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const accessToken = Cookies.get('UserAccessToken');
  const societyId = Cookies.get('SocietyId'); // User's society ID from cookie

  const fetchAmenities = async () => {
    if (!accessToken || !societyId) {
      setError("Authentication details missing. Please log in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[User Amenities Page] Fetching from /api/amenities?societyId=${societyId}`);
      // Call the BASE amenity endpoint - it should handle USER auth correctly now
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities?societyId=${societyId}`, {
        headers: { Authorization: `Bearer ${accessToken}` } // Send USER token
      });
      console.log("[User Amenities Page] API Response:", res.data);
      setAllAmenities(res.data || []);
      setFilteredAmenities(res.data || []);
    } catch (err) {
      console.error("Error fetching user amenities:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to load amenities.");
      setAllAmenities([]);
      setFilteredAmenities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAmenities(); }, []); // Fetch on mount

  useEffect(() => { // Filtering logic
    const lowerSearchTerm = searchTerm.toLowerCase();
    setFilteredAmenities(
      allAmenities.filter(amenity =>
        amenity.name.toLowerCase().includes(lowerSearchTerm) ||
        amenity.description.toLowerCase().includes(lowerSearchTerm) ||
        amenity.location.toLowerCase().includes(lowerSearchTerm)
      )
    );
  }, [searchTerm, allAmenities]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold">Available Amenities</h1>
        <Input
          type="text" placeholder="Search amenities..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="max-w-full sm:max-w-sm"
        />
      </div>
      <ErrorDisplay title="Error Loading Amenities" message={error} />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AmenityCardSkeleton /> <AmenityCardSkeleton /> <AmenityCardSkeleton />
        </div>
      ) : filteredAmenities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity) => ( <AmenityCard key={amenity._id} amenity={amenity} /> ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-10">
          {allAmenities.length > 0 ? "No amenities match your search." : "No amenities available yet."}
        </div>
      )}
    </div>
  )
}