import connectMongo from "@/lib/db";
import Worker from "@/models/worker"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify Admin Token ---
// (You could move this to a shared utility file)
async function verifyAdminToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        return { error: "Unauthorized: No token provided", status: 401, payload: null };
    }
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (!adminPayload?.id) {
             return { error: "Unauthorized: Invalid token payload", status: 401, payload: null };
        }
        return { error: null, status: 200, payload: adminPayload };
    } catch (err) {
        return { error: `Unauthorized: ${err.message}`, status: 401, payload: null };
    }
}

// --- PUT Handler (Update specific worker) ---
export async function PUT(req, { params }) {
  console.log(`--- HIT: PUT /api/admin/workers/${params.id} ---`);
  const { id } = params; // Get worker ID from the dynamic route segment

  // 1. Verify Admin Token
  const authResult = await verifyAdminToken(req);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  // 2. Validate Worker ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Bad Request: Invalid Worker ID format" }, { status: 400 });
  }

  try {
    await connectMongo();

    // 3. Get Update Data from Request Body
    const updateData = await req.json();

    // Basic validation - ensure essential fields aren't blank if provided
    if (updateData.name === "" || updateData.workerID === "" || updateData.department === "" || updateData.experience < 0) {
         return NextResponse.json({ message: "Bad Request: Required fields cannot be empty or invalid" }, { status: 400 });
    }

    // Optional: Prevent certain fields from being updated directly if needed
    // delete updateData._id;
    // delete updateData.societyId; // Should not be changed here
    // delete updateData.createdAt;
    // delete updateData.updatedAt;

    console.log(`Updating worker ${id} with data:`, updateData);

    // 4. Find and Update Worker
    // We also check societyId implicitly if needed, but the primary check is the ID.
    // If you need to ensure the admin can ONLY update workers in THEIR society,
    // you'd need the societyId from the admin token (if stored) or passed separately.
    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // Return updated doc, run schema validation
    );

    // 5. Handle Not Found
    if (!updatedWorker) {
      console.log(`Worker not found for ID: ${id}`);
      return NextResponse.json({ message: "Worker not found" }, { status: 404 });
    }

    console.log("Worker updated successfully:", updatedWorker);

    // 6. Return Success Response
    return NextResponse.json({ message: "Worker updated successfully", worker: updatedWorker }, { status: 200 });

  } catch (error) {
    console.error(`API Error updating worker ${id}:`, error);
    if (error.name === 'ValidationError') {
         return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Server error updating worker", error: error.message }, { status: 500 });
  }
}


// --- DELETE Handler (Delete specific worker) ---
export async function DELETE(req, { params }) {
  console.log(`--- HIT: DELETE /api/admin/workers/${params.id} ---`);
  const { id } = params; // Get worker ID

  // 1. Verify Admin Token
   const authResult = await verifyAdminToken(req);
   if (authResult.error) {
     return NextResponse.json({ message: authResult.error }, { status: authResult.status });
   }

  // 2. Validate Worker ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Bad Request: Invalid Worker ID format" }, { status: 400 });
  }

  try {
    await connectMongo();

    console.log(`Attempting to delete worker ${id}`);

    // 3. Find and Delete Worker
    // Add societyId check if necessary for security:
    // const deletedWorker = await Worker.findOneAndDelete({ _id: id, societyId: societyIdFromAdminToken });
    const deletedWorker = await Worker.findByIdAndDelete(id);

    // 4. Handle Not Found
    if (!deletedWorker) {
      console.log(`Worker not found for ID: ${id}`);
      return NextResponse.json({ message: "Worker not found" }, { status: 404 });
    }

    console.log("Worker deleted successfully:", deletedWorker);

    // 5. Return Success Response
    // Often return 204 No Content for DELETE, or 200 with a message
    return NextResponse.json({ message: "Worker deleted successfully" }, { status: 200 });
    // return new NextResponse(null, { status: 204 }); // Alternative

  } catch (error) {
    console.error(`API Error deleting worker ${id}:`, error);
    return NextResponse.json({ message: "Server error deleting worker", error: error.message }, { status: 500 });
  }
}