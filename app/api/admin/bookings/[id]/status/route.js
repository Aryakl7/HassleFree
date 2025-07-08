// FILE: app/api/admin/bookings/[id]/status/route.js
import connectMongo from "@/lib/db";         // Adjust path if needed
import Booking from "@/models/booking";     // Adjust path if needed
import AttendanceLog from "@/models/attendance"; // Adjust path if needed
import Amenity from "@/models/amenity"; // Needed to get amenity name for log
import User from "@/models/user"; // Needed to get user name for log
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify Admin Token ---
// TODO: Enhance this if Guards need separate tokens/permissions
async function verifyAdminToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };
    try {
        // ASSUMPTION: Admin token contains admin 'id' and their 'societyId'
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (!adminPayload?.id || !adminPayload?.societyId) { // Check for both id and societyId
            console.error("Admin token payload missing required fields (id or societyId).");
            throw new Error("Invalid token payload structure");
        }
        // You might want to fetch the Admin record here if you need more details like name/role
        // const admin = await Admin.findById(adminPayload.id).lean(); // Example
        // if(!admin) throw new Error("Admin not found");
        // adminPayload.name = admin.name; // Add extra info if needed

        console.log("[Booking Status API] Verified as ADMIN. Payload:", adminPayload);
        return { isValid: true, error: null, status: 200, payload: adminPayload };
    } catch (err) {
        console.error("[Booking Status API] Admin Token Verification FAILED:", err.message);
        return { isValid: false, error: `Unauthorized: ${err.message}`, status: 401, payload: null };
    }
}

// Define valid statuses an admin/guard can set via this endpoint
const ALLOWED_BOOKING_STATUSES_BY_ADMIN = ['checked-in', 'checked-out', 'cancelled', 'no_show', 'confirmed']; // Add/remove as per your workflow needs

// --- PUT Handler (Update booking status) ---
export async function PUT(req, { params }) {
    const { id } = params; // Booking ID from the URL path e.g., /api/admin/bookings/BOOKING_ID/status
    console.log(`--- HIT: PUT /api/admin/bookings/${id}/status ---`);

    try {
        await connectMongo();
        console.log("[Booking Status API] DB Connected.");

        // 1. Verify Admin/Guard Token & Get Society/Operator ID
        const authResult = await verifyAdminToken(req); // Use admin token verification
        if (!authResult.isValid) {
            return NextResponse.json({ message: authResult.error }, { status: authResult.status });
        }
        const adminSocietyId = authResult.payload.societyId;
        const operatorId = authResult.payload.id; // ID of admin/staff performing action

        // 2. Validate Booking ID from URL Param
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Bad Request: Invalid Booking ID format" }, { status: 400 });
        }

        // 3. Get New Status from Request Body
        const { status } = await req.json();
        console.log(`[Booking Status API] Received request to update booking ${id} to status: ${status}`);

        if (!status || !ALLOWED_BOOKING_STATUSES_BY_ADMIN.includes(status)) {
            return NextResponse.json({ message: `Bad Request: Invalid or missing status. Allowed values: ${ALLOWED_BOOKING_STATUSES_BY_ADMIN.join(', ')}` }, { status: 400 });
        }

        // 4. Find Booking & Validate Society Ownership
        // Populate related data needed for logging and validation
        const booking = await Booking.findOne({ _id: id, societyId: adminSocietyId })
                                     .populate('userId', 'name') // Get user name
                                     .populate('amenityId', 'name status capacity'); // Get amenity details

        if (!booking) {
            // It either doesn't exist or doesn't belong to the admin's society
            console.log(`[Booking Status API] Booking ${id} not found or not in society ${adminSocietyId}`);
            return NextResponse.json({ message: "Booking not found or access denied" }, { status: 404 }); // Use 404 or 403
        }

        const currentStatus = booking.status;
        console.log(`[Booking Status API] Current booking status: ${currentStatus}`);

        // 5. Add Status Transition Logic (Prevent invalid changes)
        if (status === currentStatus) {
             return NextResponse.json({ message: `Booking is already in '${status}' status.` }, { status: 400 });
        }
        if (status === 'checked-in' && !['confirmed', 'approved'].includes(currentStatus)) {
             return NextResponse.json({ message: `Cannot check-in booking with current status: ${currentStatus}` }, { status: 400 });
        }
        if (status === 'checked-out' && currentStatus !== 'checked-in') {
             return NextResponse.json({ message: `Cannot check-out booking with current status: ${currentStatus}` }, { status: 400 });
        }
        if (status === 'no_show' && !['confirmed', 'approved'].includes(currentStatus)) {
            // Maybe allow marking no-show even if pending? Depends on rules.
             return NextResponse.json({ message: `Cannot mark as no-show booking with status: ${currentStatus}` }, { status: 400 });
        }
         if (status === 'cancelled' && ['checked-out', 'completed', 'no_show', 'cancelled'].includes(currentStatus)) {
             return NextResponse.json({ message: `Cannot cancel booking with current status: ${currentStatus}` }, { status: 400 });
        }
         // Add more rules as needed (e.g., cannot check-in if amenity status is not 'operational')
         if (status === 'checked-in' && booking.amenityId?.status !== 'operational') {
              return NextResponse.json({ message: `Cannot check-in, amenity '${booking.amenityId?.name}' is currently ${booking.amenityId?.status}.` }, { status: 400 });
         }


        // 6. Prepare Update Data & Timestamps
        const now = new Date();
        const updateData = { status: status };
        // Update timestamps based on the new status
        if (status === 'checked-in') {
            updateData['timestamps.entry'] = now;
            // Clear exit time if re-checking-in (unlikely workflow but possible)
            updateData['timestamps.exit'] = null;
        }
        if (status === 'checked-out') {
             // Ensure there was an entry time before setting exit time
             if (!booking.timestamps?.entry) {
                 console.warn(`[Booking Status API] Checking out booking ${id} without an entry time.`);
                 updateData['timestamps.entry'] = now; // Set entry time to now if missing? Or throw error?
             }
            updateData['timestamps.exit'] = now;
            // Optionally mark status as 'completed' instead of 'checked-out' after exit?
            // updateData.status = 'completed';
        }
        if (status === 'cancelled') {
            updateData.cancelledAt = now;
            // Optionally get cancellation reason from request body:
            // const { cancellationReason } = await req.json(); // Get from body if provided
            // if (cancellationReason) updateData.cancellationReason = cancellationReason;
        }
        // Add logic for 'completed' status if needed


        // 7. Update Booking Document
        const updatedBooking = await Booking.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

        // 8. Create Attendance Log (If Check-in or Check-out)
        if (status === 'checked-in' || status === 'checked-out') {
            try {
                const userName = booking.userId?.name || `User_${booking.userId?.toString().slice(-4)}`;
                const amenityName = booking.amenityId?.name || `Amenity_${booking.amenityId?.toString().slice(-4)}`;

                await AttendanceLog.create({
                    userId: booking.userId._id,
                    personName: userName,
                    bookingId: booking._id, // Link log to the booking
                    societyId: booking.societyId,
                    timestamp: now,
                    type: status === 'checked-in' ? 'entry' : 'exit',
                    source: 'amenity_checkin', // Source is amenity
                    location: amenityName, // Use amenity name as location
                    verificationMethod: 'manual_admin', // Assume admin/guard did it manually
                    verifiedBy: operatorId, // ID of the admin/guard from token
                    status: 'verified',
                });
                 console.log(`[Booking Status API] Attendance log created for booking ${id}, status ${status}`);
            } catch (logError) {
                console.error("[Booking Status API] Failed to create attendance log:", logError);
                // Decide if this should fail the whole operation or just log an error
                // For now, just log it and continue.
            }
        }

        console.log(`[Booking Status API] Booking ${id} status updated to ${status} by operator ${operatorId}`);
        // 9. Return Success Response
        return NextResponse.json({ message: "Booking status updated successfully", booking: updatedBooking }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating booking ${id} status:`, error);
        if (error.name === 'ValidationError') {
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating booking status", error: error.message }, { status: 500 });
    }
}