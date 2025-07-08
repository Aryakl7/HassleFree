import connectMongo from "@/lib/db";
import User from "@/models/user"; // Correct model import
import Society from "@/models/society"; // Need to find society by invite code
import bcrypt from "bcryptjs";
import { NextResponse } from 'next/server';

// TODO: Implement a way to manage invite codes (maybe add to Society model?)
// For now, we'll assume a simple lookup - replace with your actual logic
async function findSocietyByInviteCode(inviteCode) {
    // Placeholder: In reality, query your database for a society matching the code
    // Example: const society = await Society.findOne({ inviteCode: inviteCode });
    // For testing, let's hardcode one (REPLACE THIS)
    if (inviteCode === "TEST_INVITE_123") {
        // Find *a* society - replace with actual lookup logic based on the code
         return await Society.findOne(); // Or find by a specific known ID
    }
    return null;
}

export async function POST(req) {
  try {
    await connectMongo();

    const { name, email, password, houseNo, flatNo, inviteCode /*, age, photo, car data... */ } = await req.json();

    // --- Validation ---
    if (!name || !email || !password || !houseNo || !flatNo || !inviteCode) {
      return NextResponse.json({ message: "Missing required fields (Name, Email, Password, House, Flat, Invite Code)" }, { status: 400 });
    }

    // --- Check Existing User ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 }); // Conflict
    }

    // --- Validate Invite Code & Find Society ---
    const society = await findSocietyByInviteCode(inviteCode);
    if (!society) {
         return NextResponse.json({ message: "Invalid Invite Code" }, { status: 400 });
    }

    // --- Hash Password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create User ---
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      houseNo,
      flatNo,
      societyId: society._id, // Assign the society found via invite code
      // Add other fields like age, photo defaults if needed
       photo: { url: '', isVerified: false }, // Example default
       noOfCars: 0,
       carNumbers: []
    });

    await newUser.save();

    // Don't usually return password hash
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
        { message: "User created successfully", user: userResponse, status: "success" },
        { status: 201 }
    );

  } catch (err) {
    console.error("User Signup Error:", err);
    // Mongoose validation error handling
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