// FILE: app/api/announcement/route.js
import connectMongo from "@/lib/db";
import announcement from "@/models/announcement"; // Use correct model name/path
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';


export async function GET(req) {
  console.log("--- HIT: GET /api/announcement ---");
  try {
    await connectMongo();
    console.log("DB Connection Successful (or already connected)");

    const token = req.headers.get('authorization')?.split(' ')[1];
    console.log("Extracted Token:", token);

    if (!token) {
      console.log("No token found in request.");
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    let verifiedPayload;
    try {
      verifiedPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); // Use ADMIN secret
      console.log("Token Verified Successfully. Payload:", verifiedPayload);
       if (!verifiedPayload?.id) throw new Error("Invalid payload structure"); // Check payload validity early
    } catch (err) {
       console.error("Token Verification Failed:", err.message);
       return NextResponse.json({ error: `Unauthorized: Token verification failed (${err.name})` }, { status: 401 });
    }

    const url = new URL(req.url);
    const societyId = url.searchParams.get("societyId");
    console.log("Extracted societyId from URL:", societyId);

    if (!societyId) {
      console.log("societyId not found in URL query params.");
      return NextResponse.json({ error: "Society ID not provided" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(societyId)) {
        console.log("Invalid societyId format:", societyId);
        return NextResponse.json({ error: "Invalid Society ID format" }, { status: 400 });
    }

    console.log(`Querying announcements for societyId: ${societyId}`);
    const announcementsData = await announcement.find({ societyId: societyId }); // Use a different variable name
    console.log("Query Result (Count):", announcementsData.length);

    // It's highly unlikely find() returns non-array, but check remains ok
    if (!Array.isArray(announcementsData)) {
        console.error("Database query did not return an array:", announcementsData);
        // Let this fall through to the main catch block for consistency
        throw new Error("Unexpected database query result.");
    }

    console.log("Returning successful announcement data.");
    // Success case: Return the data
    return NextResponse.json({ announcements: announcementsData }, { status: 200 });

  } catch (error) {
    // Catch ANY error from connectMongo, verify, find, or thrown errors
    console.error("API Route Error (GET /api/announcement):", error);
    // Ensure a response is ALWAYS returned from the catch block
    return NextResponse.json({ error: "Failed to fetch announcements", detail: error.message || "Unknown server error" }, { status: 500 });
  }

}

// --- POST Handler (Corrected) ---
export async function POST(req) {
    console.log("--- HIT: POST /api/announcement ---");
    try {
        await connectMongo();
        console.log("[API POST Ann] DB Connected.");

        const token = req.headers.get('authorization')?.split(' ')[1];
        console.log("[API POST Ann] Token Received:", token);
        if (!token) return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });

        let adminPayload;
        try {
            // Verify using the ADMIN secret
            adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
            console.log("[API POST Ann] Token Verified. Payload:", adminPayload);
            // *** Ensure the payload actually contains the admin's ID ***
            if (!adminPayload?.id) {
                 console.error("[API POST Ann] Admin ID missing from token payload!");
                 throw new Error("Invalid token payload structure");
            }
        } catch (err) {
            console.error("[API POST Ann] Token Verification FAILED:", err.message);
            return NextResponse.json({ error: `Forbidden: Invalid admin token (${err.message})` }, { status: 403 });
        }

        const body = await req.json();
        console.log("[API POST Ann] Received Body:", body);

        const { title, description, priority, audience, societyId, attachments, notifyUsers, targetedUsers } = body;
        if (!title || !description || !priority || !audience || !societyId) {
             console.log("[API POST Ann] Validation Failed: Missing required fields.");
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(societyId)) {
             console.log("[API POST Ann] Validation Failed: Invalid societyId.");
             return NextResponse.json({ error: 'Invalid Society ID format' }, { status: 400 });
         }

        // *** FIX: Include the adminId from the verified token payload ***
        const newAnnouncementData = {
            title,
            description,
            priority: priority || 'medium',
            audience: audience || 'all',
            attachments: attachments || [],
            notifyUsers: notifyUsers || false,
            targetedUsers: targetedUsers || [],
            societyId: societyId,
            adminId: adminPayload.id, // <-- ADD THIS LINE
        };
        console.log("[API POST Ann] Data for Model:", newAnnouncementData);

        // Ensure the model variable 'announcement' matches your import
        const newAnnouncement = new announcement(newAnnouncementData);
        console.log("[API POST Ann] Saving announcement...");
        await newAnnouncement.save(); // This was failing due to missing adminId
        console.log("[API POST Ann] Announcement Saved:", newAnnouncement._id);

        return NextResponse.json(
            { message: 'Announcement created successfully', announcement: newAnnouncement },
            { status: 201 }
        );
    } catch (error) {
        console.error("API Route Error (POST /api/announcement):", error);
         if (error.name === 'ValidationError') {
             // This is where the previous error was being caught
             console.error("[API POST Ann] Mongoose Validation Error:", error.errors);
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
         }
        return NextResponse.json({ error: "Failed to create announcement", detail: error.message }, { status: 500 });
    }
}

// --- PUT Handler ---
// Remember to also add adminId verification if needed in PUT, although you usually update based on announcement ID.

// --- DELETE Handler ---
// Remember to add admin token verification. You usually delete based on announcement ID.