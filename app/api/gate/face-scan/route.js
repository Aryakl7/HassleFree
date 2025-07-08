// FILE: app/api/gate/face-scan/route.js
import connectMongo from "@/lib/db";
import User from "@/models/user";
import Worker from "@/models/worker";
import AttendanceLog from "@/models/attendance";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from "mongoose"; // For ObjectId.isValid

async function verifyGuardToken(req) { /* ... (definition from previous response) ... */ }

export async function POST(req) {
    console.log("--- HIT: POST /api/gate/face-scan ---");
    try {
        await connectMongo();
        const authResult = await verifyGuardToken(req); // Ensure this helper is defined or imported
        if (!authResult.isValid) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const { identifiedPersonId, personType, direction, gateLocation } = await req.json();

        if (!identifiedPersonId || !personType || !direction || !gateLocation) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // *** Add validation for identifiedPersonId format ***
        if (!mongoose.Types.ObjectId.isValid(identifiedPersonId)) {
            return NextResponse.json({ error: "Invalid identifiedPersonId format. Expected ObjectId." }, { status: 400 });
        }
        // *** End validation ***

        let personName = "Unknown";
        let logData = {
            societyId: authResult.payload.societyId,
            timestamp: new Date(),
            type: direction,
            source: 'main_gate',
            location: gateLocation,
            verificationMethod: 'facial_recognition', // Could be 'manual_face_sim' if distinguishing
            verifiedBy: authResult.payload.id,
            status: 'verified'
        };

        if (personType === 'user') {
            // Now findById should work as identifiedPersonId is expected to be an ObjectId string
            const user = await User.findById(identifiedPersonId).select('name houseNo flatNo societyId');
            if (!user) return NextResponse.json({ error: "User not found with the provided ID" }, { status: 404 });
            // Security check: Ensure user belongs to the guard's/admin's society
            if (user.societyId.toString() !== authResult.payload.societyId) {
                 return NextResponse.json({ error: "Forbidden: User does not belong to this society." }, { status: 403 });
            }
            personName = user.name;
            logData.userId = user._id;
            logData.personName = personName;
            logData.purpose = `Resident ${direction}`;
        } else if (personType === 'worker') {
            const worker = await Worker.findById(identifiedPersonId).select('name workerID department societyId');
            if (!worker) return NextResponse.json({ error: "Worker not found with the provided ID" }, { status: 404 });
            if (worker.societyId.toString() !== authResult.payload.societyId) {
                 return NextResponse.json({ error: "Forbidden: Worker does not belong to this society." }, { status: 403 });
            }
            personName = worker.name;
            logData.workerId = worker._id; // If you have this field in AttendanceLog
            logData.personName = personName;
            logData.purpose = `Staff ${direction} (${worker.department})`;
        } else {
            return NextResponse.json({ error: "Invalid personType" }, { status: 400 });
        }

        await AttendanceLog.create(logData);
        console.log(`${direction} logged for ${personType} ${personName} (ID: ${identifiedPersonId}) via face scan sim.`);
        return NextResponse.json({ message: `${direction} successful for ${personName}` }, { status: 200 });

    } catch (error) {
        console.error("Face Scan API Error:", error);
        if (error.name === 'CastError' && error.path === '_id') {
             return NextResponse.json({ error: "Invalid ID format provided for lookup.", detail: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Face scan processing failed", detail: error.message }, { status: 500 });
    }
}