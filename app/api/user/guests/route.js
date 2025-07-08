// FILE: app/api/user/guests/route.js (Verify/Update POST Handler)
import connectMongo from "@/lib/db";
import guest from "@/models/guest";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server'; // Use NextResponse
import mongoose from 'mongoose'; // For ObjectId validation

// --- POST: Add a new guest ---
export async function POST(req) {
  console.log("--- HIT: POST /api/user/guests ---");
  try {
    await connectMongo();

    // 1. Verify USER Token & Get User/Society ID
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });

    let userPayload;
    try {
      userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
      // *** Ensure payload has id AND societyId ***
      if (!userPayload?.id || !userPayload?.societyId) {
        throw new Error("Invalid token payload structure (missing id or societyId)");
      }
    } catch (err) {
      return NextResponse.json({ error: `Unauthorized: Invalid token (${err.message})` }, { status: 401 });
    }
    const userId = userPayload.id;
    const societyId = userPayload.societyId; // Get societyId from token

    // 2. Get Guest Data from Body
    const { name, noOfPeople, date, carNo, purpose, validUntil } = await req.json();

    // 3. Validation
    if (!name || !noOfPeople || !date || !purpose || !validUntil) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Add more validation (e.g., date formats, noOfPeople > 0)

    // 4. Create Guest Document
    const newGuest = new guest({
      guestId: `G-${Date.now().toString().slice(-6)}`, // Generate a shorter, somewhat unique ID
      name,
      noOfPeople: Number(noOfPeople) || 1, // Ensure it's a number
      date: new Date(date), // Ensure it's a Date object
      carNo: carNo || null, // Handle optional car number
      purpose,
      userId: userId, // Link to the user who added the guest
      status: "pending", // <<< --- Default status
      validUntil: new Date(validUntil), // Ensure it's a Date object
      qrCode: null, // QR code generated later
      societyId: societyId // Link to the user's society
    });

    await newGuest.save();
    console.log(`User ${userId} added guest ${newGuest._id}`);

    return NextResponse.json(
        { message: "Guest added successfully", guest: newGuest },
        { status: 201 }
    );
  } catch (err) {
    console.error("[User Add Guest API] Error:", err);
     if (err.name === 'ValidationError') {
         return NextResponse.json({ error: `Validation Failed: ${err.message}`, errors: err.errors }, { status: 400 });
     }
    return NextResponse.json({ error: err.message || "Failed to add guest" }, { status: 500 });
  }
}

// --- GET: Retrieve guests for the logged-in user ---
export async function GET(req) {
    // ... (Ensure this GET handler exists and works correctly, using USER token) ...
     console.log("--- HIT: GET /api/user/guests ---");
     try {
        await connectMongo();
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        let userPayload;
        try { userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER); if (!userPayload?.id) throw new Error("Invalid"); }
        catch(err){ return NextResponse.json({ error: `Unauthorized: ${err.message}` }, { status: 401 }); }

        const guests = await guest.find({ userId: userPayload.id }).sort({ createdAt: -1 });
        return NextResponse.json({ message: "Guests retrieved", guests: guests || [] }, { status: 200 });
     } catch (err) {
        console.error("[User Get Guests API] Error:", err);
        return NextResponse.json({ error: err.message || "Failed to get guests" }, { status: 500 });
     }
}