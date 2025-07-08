// FILE: app/api/admin/guests/route.js
import connectMongo from "@/lib/db";
import Guest from "@/models/guest";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
  console.log("--- HIT: GET /api/admin/guests ---");
  try {
    await connectMongo();

    // 1. Verify Admin Token
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    let adminPayload;
    try {
      adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
      if (!adminPayload?.id) throw new Error("Invalid payload");
      // TODO: Ideally get societyId from adminPayload if stored during login
    } catch (err) { return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 }); }

    // 2. Get Society ID & Status Filter from Query Params
    const url = new URL(req.url);
    const societyId = url.searchParams.get("societyId"); // Required
    const statusFilter = url.searchParams.get("status"); // Optional filter

    if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
      return NextResponse.json({ message: "Bad Request: Valid Society ID required" }, { status: 400 });
    }
     // Optional: Verify admin belongs to this societyId

    // 3. Build Query
    const query = { societyId: societyId };
    if (statusFilter && statusFilter !== 'all') {
        // Validate status filter if needed
         if (['pending', 'approved', 'rejected', 'checked-in', 'checked-out'].includes(statusFilter)) {
             query.status = statusFilter;
         } else {
             console.warn(`[Admin Guests API] Invalid status filter received: ${statusFilter}`);
             // Decide how to handle invalid filter - ignore it or return error?
             // Ignoring for now:
         }
    }
    console.log("[Admin Guests API] Query:", query);

    // 4. Fetch Guests and Populate User Name
    const guests = await Guest.find(query)
                        .sort({ createdAt: -1 })
                        .populate('userId', 'name houseNo flatNo'); // Populate resident info

    return NextResponse.json({ guests: guests || [] }, { status: 200 });

  } catch (error) {
    console.error("API Error fetching admin guests:", error);
    return NextResponse.json({ message: "Server error fetching guests", error: error.message }, { status: 500 });
  }
}