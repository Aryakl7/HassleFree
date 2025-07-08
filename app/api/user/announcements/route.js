// FILE: app/api/user/announcements/route.js
import connectMongo from "@/lib/db"; // Adjust path if your lib folder is elsewhere
import announcement from "@/models/announcement"; // Adjust path to your announcement model
import User from "@/models/user"; // Adjust path - needed if filtering by block later
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- GET Handler: Fetches announcements visible to the logged-in user ---
export async function GET(req) {
  console.log("--- HIT: GET /api/user/announcements ---");
  try {
    // 1. Connect to Database
    await connectMongo();
    console.log("[User Ann API] DB Connected.");

    // 2. Verify USER Access Token
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
        console.log("[User Ann API] No token provided.");
        return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    let userPayload;
    try {
      // Verify using the USER secret
      userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
      console.log("[User Ann API] Token Verified. Payload:", userPayload);

      // Validate payload structure (needs id and societyId from login step)
      if (!userPayload?.id || !userPayload?.societyId) {
        console.error("[User Ann API] ID or SocietyID missing from token payload!");
        throw new Error("Invalid token payload structure");
      }
    } catch (err) {
      console.error("[User Ann API] Token Verification FAILED:", err.message);
      return NextResponse.json({ error: `Unauthorized: Invalid token (${err.name || 'Error'})` }, { status: 401 });
    }

    // 3. Extract User ID and Society ID from Payload
    const userId = userPayload.id;
    const societyId = userPayload.societyId;

    // Optional: Validate IDs if needed (verify should handle basic structure)
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(societyId)) {
        console.error("[User Ann API] Invalid ObjectId format in token payload.");
        return NextResponse.json({ error: "Internal server configuration error." }, { status: 500 });
    }

    // 4. Fetch Announcements based on Audience
    console.log(`[User Ann API] Querying announcements for societyId: ${societyId} and userId: ${userId}`);

    // --- Advanced Audience Logic (Optional - Requires User Schema Update) ---
    // To filter by 'specific_blocks', you'd need the user's block info.
    // First, fetch the user's block if needed (uncomment and adjust if you add 'block' to User schema):
    // const currentUser = await User.findById(userId).select('block');
    // const userBlock = currentUser?.block;
    // console.log("[User Ann API] User Block:", userBlock);
    // ----------------------------------------------------------------------

    const query = {
        societyId: societyId,
        $or: [
            { audience: 'all' }, // Include announcements for everyone
            { audience: 'specific_users', targetedUsers: userId } // Include announcements specifically targeting this user
            // --- Add block filtering if implemented ---
            // ...(userBlock ? [{ audience: 'specific_blocks', targetedBlocks: userBlock }] : []) // Include if user has a block and it's targeted
            // -----------------------------------------
        ]
     };

    const announcementsData = await announcement.find(query)
     .sort({ createdAt: -1 }) // Show newest first
     .populate('adminId', 'name'); // Show the name of the admin who posted it

    console.log("[User Ann API] Query Result (Count):", announcementsData.length);

    // 5. Return Response
    return NextResponse.json({ announcements: announcementsData || [] }, { status: 200 });

  } catch (error) {
    // Catch ANY error from connectMongo, verify, find, or thrown errors
    console.error("API Route Error (GET /api/user/announcements):", error);
    return NextResponse.json({ error: "Failed to fetch announcements", detail: error.message || "Unknown server error" }, { status: 500 });
  }
}

// Note: Regular users typically don't POST/PUT/DELETE announcements via API.
// Those actions are usually restricted to admins via /api/announcement or /api/admin/announcement routes.