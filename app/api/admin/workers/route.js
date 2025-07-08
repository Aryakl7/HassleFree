// FILE: app/api/admin/workers/route.js
import connectMongo from "@/lib/db";
import Worker from "@/models/worker"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- GET Handler (Fetch all workers for a society) ---
export async function GET(req) {
    // ... (GET Handler code provided previously - ensure it's correct) ...
    console.log("--- HIT: GET /api/admin/workers ---");
      try {
        await connectMongo();
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
        let adminPayload;
        try { adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); if (!adminPayload?.id) throw new Error("Invalid payload");
        } catch (err) { return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 }); }
        const url = new URL(req.url); const societyId = url.searchParams.get("societyId");
        if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) return NextResponse.json({ message: "Bad Request: Valid Society ID required" }, { status: 400 });
        console.log(`Fetching workers for societyId: ${societyId}`);
        const workers = await Worker.find({ societyId: societyId });
        console.log(`Found ${workers.length} workers`);
        return NextResponse.json({ workers: workers || [] }, { status: 200 });
      } catch (error) { console.error("API Error fetching admin workers:", error); return NextResponse.json({ message: "Server error fetching workers", error: error.message }, { status: 500 }); }
}


// --- POST Handler (Admin creates a new worker) ---
export async function POST(req) {
  console.log("--- HIT: POST /api/admin/workers ---");
 try {
    // ... (Admin Token Verification, connectMongo) ...
    const { workerID, name, department, experience, photo, societyId } = await req.json();

    if (!workerID || !name || !department || experience === undefined || experience < 0 || !societyId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const existingWorker = await Worker.findOne({ workerID, societyId });
    if (existingWorker) {
      return NextResponse.json({ message: `Worker with ID ${workerID} already exists in this society` }, { status: 409 });
    }

    const newWorker = new Worker({ // MongoDB will auto-generate _id
      workerID, name, department, experience,
      photo: photo || { url: '' },
      societyId,
      // rating and noOfWorks will use schema defaults
    });
    await newWorker.save();
    // newWorker will now have _id populated by MongoDB
    console.log("Admin created worker:", newWorker._id, "with workerID:", newWorker.workerID);
    return NextResponse.json({ message: "Worker created", worker: newWorker }, { status: 201 });
  
} catch (err) {
    console.error("Admin Worker Creation Error:", err);
    if (err.name === 'ValidationError') {
         return NextResponse.json(
            { message: `Validation Failed: ${err.message}`, errors: err.errors, status: "error" },
            { status: 400 }
         );
    }
    // Handle potential duplicate key error for workerID if schema index is set
     if (err.code === 11000 && err.keyPattern?.workerID) {
         return NextResponse.json({ message: `Worker ID '${err.keyValue.workerID}' already exists.` }, { status: 409 });
     }
    return NextResponse.json(
        { message: "Something went wrong creating worker", status: "error", errorDetail: err.message },
        { status: 500 }
    );
  }
}