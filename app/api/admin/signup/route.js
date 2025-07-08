// FILE: app/api/admin/signup/route.js
import connectMongo from "@/lib/db";
import Admin from "@/models/admin"; // Use correct import name
import Society from "@/models/society"; // Use correct import name
import bcrypt from "bcryptjs";
import mongoose from 'mongoose'; // Import mongoose for transactions
import { NextResponse } from "next/server"; // Use NextResponse

export async function POST(req) {
  const session = await mongoose.startSession(); // Start a transaction session
  session.startTransaction();

  try {
    await connectMongo();

    const {
      name,
      email,
      password,
      societyName,
      societyAddress,
      pincode,
      latitude,
      longitude,
    } = await req.json();

    // --- Basic Validation ---
    if (!name || !email || !password || !societyName || !societyAddress || !pincode || !latitude || !longitude) {
        await session.abortTransaction(); // Abort before finishing
        session.endSession();
        return NextResponse.json({ message: "Please provide all the details" }, { status: 400 });
    }

    // --- Check Existing Admin ---
    const existingAdmin = await Admin.findOne({ email }).session(session); // Use session
    if (existingAdmin) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ message: "Admin already exists", status: "error" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Step 1: Create Admin first (without saving yet, just preparing data) ---
    // We need the admin's potential _id if the Society schema requires adminId immediately
    // Or, if Society's adminId is not required *at creation*, we can create society first.
    // Let's assume Society needs adminId, so we create admin data first.

    // NOTE: We will save admin *after* society is created and we have societyId.
    // If societyId IS required on Admin model, this approach needs adjustment.
    // --- Re-evaluating based on error: The error says Admin requires societyId.
    // --- Let's reverse the order. Create Society first.

    // --- Step 1 (Revised): Create Society ---
    // Temporarily use a placeholder or null for adminId if the Society schema allows it,
    // otherwise, this two-way dependency is tricky without adjusting schemas or
    // generating IDs beforehand.
    // *** Assuming Society schema's adminId IS required ***

    // Generate IDs beforehand
    const newAdminId = new mongoose.Types.ObjectId();
    const newSocietyId = new mongoose.Types.ObjectId();

    // --- Step 1: Create Society with link to future Admin ---
     const societyData = {
      _id: newSocietyId, // Assign pre-generated ID
      name: societyName,
      address: societyAddress,
      pincode,
      location: { latitude, longitude },
      adminId: newAdminId, // Link to the admin we are about to create
     };
    const [createdSociety] = await Society.create([societyData], { session: session });
    console.log("Society created with ID:", createdSociety._id);


    // --- Step 2: Create Admin, now with the required societyId ---
    const adminData = {
       _id: newAdminId, // Assign pre-generated ID
      name,
      email,
      password: hashedPassword,
      societyId: createdSociety._id, // Use the ID from the created society
    };
    const [createdAdmin] = await Admin.create([adminData], { session: session });
     console.log("Admin created with ID:", createdAdmin._id);


    // --- Commit Transaction ---
    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
        { message: "Admin and Society created successfully", status: "success" },
        { status: 201 }
    );

  } catch (err) {
    // --- Abort Transaction on Error ---
    await session.abortTransaction();
    session.endSession();

    console.error("Signup Error:", err); // Log the full error

    // Check if it's a Mongoose validation error
    if (err.name === 'ValidationError') {
      return NextResponse.json(
        { message: `Validation Failed: ${err.message}`, errors: err.errors, status: "error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
        { message: "Something went wrong during signup", status: "error", errorDetail: err.message },
        { status: 500 }
    );
  }
}