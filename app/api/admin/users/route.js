// FILE: app/api/admin/users/route.js
import connectMongo from "@/lib/db";
import User from "@/models/user"; // Use correct model import
import Society from "@/models/society"; // Might need for validation if needed
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';


// --- GET Handler (Fetch all users for a society) ---
export async function GET(req) {
    console.log("--- HIT: GET /api/admin/users ---");
    try {
        await connectMongo();

        // 1. Verify Admin Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
        let adminPayload;
        try {
            adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
            if (!adminPayload?.id) throw new Error("Invalid payload");
        } catch (err) { return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 }); }

        // 2. Get Society ID
        const url = new URL(req.url);
        const societyId = url.searchParams.get("societyId");
        if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
            return NextResponse.json({ message: "Bad Request: Valid Society ID required" }, { status: 400 });
        }

        // Optional: Verify admin belongs to this societyId if needed
        // const admin = await Admin.findById(adminPayload.id);
        // if (!admin || admin.societyId?.toString() !== societyId) {
        //     return NextResponse.json({ message: "Forbidden: Admin does not belong to this society" }, { status: 403 });
        // }


        // 3. Fetch Users
        console.log(`Fetching users for societyId: ${societyId}`);
        const users = await User.find({ societyId: societyId }).select('-password'); // Exclude password

        return NextResponse.json({ users: users || [] }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching admin users:", error);
        return NextResponse.json({ message: "Server error fetching users", error: error.message }, { status: 500 });
    }
}


// --- POST Handler (Admin creates a new user) ---
export async function POST(req) {
  console.log("--- HIT: POST /api/admin/users ---");
  try {
    await connectMongo();

    // 1. Verify Admin Token
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
    let adminPayload;
    try {
      adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
       if (!adminPayload?.id) throw new Error("Invalid payload");
    } catch (err) { return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 }); }


    // 2. Get Data from Body
    const { name, email, password, houseNo, flatNo, societyId, age, noOfCars, carNumbers, photo } = await req.json();

    // 3. Validation
    if (!name || !email || !password || !houseNo || !flatNo || !societyId) {
      return NextResponse.json({ message: "Missing required fields (Name, Email, Password, House, Flat, SocietyID)" }, { status: 400 });
    }
    // Optional: Add more specific validation (email format, password length, etc.)

    // Optional: Verify societyId exists and matches admin's society if needed for security

    // 4. Check Existing User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 }); // Conflict
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create User Document
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      houseNo,
      flatNo,
      societyId, // Ensure this matches the admin's society or is validated
      age: age || null, // Handle optional fields
      noOfCars: noOfCars || 0,
      carNumbers: carNumbers || [],
      photo: photo || { url: '', isVerified: false }, // Use provided photo or default
    });

    await newUser.save();

    // 7. Return Success Response (without password)
    const userResponse = newUser.toObject();
    delete userResponse.password;

    console.log("Admin created user:", userResponse._id);
    return NextResponse.json(
        { message: "User created successfully by admin", user: userResponse, status: "success" },
        { status: 201 }
    );

  } catch (err) {
    console.error("Admin User Creation Error:", err);
    if (err.name === 'ValidationError') {
         return NextResponse.json(
            { message: `Validation Failed: ${err.message}`, errors: err.errors, status: "error" },
            { status: 400 }
         );
    }
    return NextResponse.json(
        { message: "Something went wrong creating user", status: "error", errorDetail: err.message },
        { status: 500 }
    );
  }
}