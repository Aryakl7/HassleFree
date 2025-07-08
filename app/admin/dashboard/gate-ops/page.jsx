'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import Cookies from 'js-cookie'; // For admin token
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanLine, Car, UserCircle, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

const GATE_LOCATION = "Main Admin Desk";

export default function AdminGateOperationsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState({ type: '', message: '', data: null }); // More detailed result

    // For Manual Vehicle Scan
    const [manualPlate, setManualPlate] = useState('');
    const [vehicleDirection, setVehicleDirection] = useState('entry');

    // For Manual Face Scan (Simulated)
    const [manualPersonId, setManualPersonId] = useState('');
    const [manualPersonType, setManualPersonType] = useState('user');
    const [faceDirection, setFaceDirection] = useState('entry');

    const adminToken = Cookies.get('AdminAccessToken');

    // --- QR Scanner Setup ---
    const qrScannerRef = useRef(null);
    const scannerInitialized = useRef(false); // To prevent re-initialization

    useEffect(() => {
        // Ensure QR Scanner div is present and not already initialized
        const qrReaderElement = document.getElementById("admin-qr-reader");
        if (qrReaderElement && !scannerInitialized.current) {
            console.log("Initializing QR Scanner for Admin...");
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "admin-qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedFormats: [Html5QrcodeSupportedFormats.QR_CODE],
                    rememberLastUsedCamera: true,
                },
                false // verbose
            );

            const onScanSuccess = async (decodedText, decodedResult) => {
                console.log(`[Admin QR Scan] Success: ${decodedText}`);
                setScanResult({ type: 'QR Scan', message: 'Processing...', data: decodedText });
                html5QrcodeScanner.pause(true);
                setIsLoading(true);
                try {
                    // TODO: Ensure POST /api/gate/verify-qr API exists
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/verify-qr`,
                        { qrDataString: decodedText },
                        { headers: { Authorization: `Bearer ${adminToken}` } } // Send Admin Token
                    );
                    toast({ title: "QR Verified", description: response.data.message });
                    setScanResult({ type: 'QR Scan', message: `Success: ${response.data.message}`, data: response.data });
                } catch (error) {
                    const errorMsg = error.response?.data?.error || "QR verification failed.";
                    toast({ title: "QR Error", description: errorMsg, variant: "destructive" });
                    setScanResult({ type: 'QR Scan', message: `Error: ${errorMsg}`, data: error.response?.data });
                } finally {
                    setIsLoading(false);
                    setTimeout(() => {
                        if (html5QrcodeScanner?.getState() === 2 /* SCANNING */) { // Check if still scanning
                           // html5QrcodeScanner.resume(); // Resume if needed
                        } else {
                            // If scanner stopped or cleared, might need to re-render it or provide a start button
                             console.log("QR Scanner not in scanning state, not resuming automatically.");
                        }
                    }, 2000);
                }
            };
            const onScanFailure = (error) => { /* console.warn(`[Admin QR Scan] Error: ${error}`); */ };

            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            scannerInitialized.current = true; // Mark as initialized

            // Cleanup on unmount
            return () => {
                if (html5QrcodeScanner && html5QrcodeScanner.getState() !== 0 /* NOT_STARTED */) {
                    html5QrcodeScanner.clear().catch(err => console.error("Failed to clear QR scanner", err));
                    scannerInitialized.current = false;
                    console.log("QR Scanner cleared on unmount.");
                }
            };
        }
    }, []); // Run only once on mount


    // --- Manual ANPR/Face Scan Simulation ---
    const handleManualScan = async (scanType) => {
        setIsLoading(true);
        setScanResult({ type: scanType, message: 'Processing...', data: null });
        let apiUrl = '';
        let payload = {};

        if (scanType === 'vehicle') {
            if (!manualPlate) { toast({ title: "Input Error", description: "License plate required.", variant: "destructive"}); setIsLoading(false); return; }
            apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/vehicle-scan`;
            payload = { plateNumber: manualPlate, direction: vehicleDirection, gateLocation: GATE_LOCATION };
        } else if (scanType === 'face') {
            if (!manualPersonId) { toast({ title: "Input Error", description: "Person ID required.", variant: "destructive"}); setIsLoading(false); return; }
            apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/face-scan`;
            payload = { identifiedPersonId: manualPersonId, personType: manualPersonType, direction: faceDirection, gateLocation: GATE_LOCATION };
        } else {
            setIsLoading(false); return;
        }

        try {
            // TODO: Ensure these POST APIs exist and handle Admin Token
            const response = await axios.post(apiUrl, payload, { headers: { Authorization: `Bearer ${adminToken}` } });
            toast({ title: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Logged`, description: response.data.message });
            setScanResult({ type: scanType, message: `Success: ${response.data.message}`, data: response.data });
            if (scanType === 'vehicle') setManualPlate('');
            if (scanType === 'face') setManualPersonId('');
        } catch (error) {
            const errorMsg = error.response?.data?.error || `Failed to log ${scanType}.`;
            toast({ title: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Error`, description: errorMsg, variant: "destructive" });
            setScanResult({ type: scanType, message: `Error: ${errorMsg}`, data: error.response?.data });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center"><ShieldCheck className="mr-3 h-8 w-8 text-primary"/>Gate Operations</h1>
                <p className="text-muted-foreground">Manually log entries/exits or use QR scanner. Current Location: {GATE_LOCATION}</p>
            </div>


            {/* QR Code Scanner Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ScanLine className="mr-2 h-5 w-5"/> QR Code Scanner</CardTitle>
                    <CardDescription>Scan guest passes or amenity booking QR codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* The div for QR scanner */}
                    <div id="admin-qr-reader" style={{ width: '100%', maxWidth: '350px', margin: '10px auto' }}></div>
                    {isLoading && scanResult.type === 'QR Scan' && (
                        <div className="text-center mt-2 flex items-center justify-center text-sm">
                            <LoadingSpinner size={16} className="mr-2"/> Processing QR...
                        </div>
                    )}
                    {scanResult.type === 'QR Scan' && scanResult.message && !isLoading && (
                        <p className={`mt-2 text-sm text-center ${scanResult.message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
                            {scanResult.message}
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Manual Vehicle Entry Simulation */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Car className="mr-2 h-5 w-5"/> Manual Vehicle Log</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label htmlFor="manualPlate">License Plate</Label><Input id="manualPlate" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase())} placeholder="KA01MJ1234" /></div>
                        <div>
                            <Label htmlFor="vehicleDirection">Direction</Label>
                            <Select value={vehicleDirection} onValueChange={setVehicleDirection}>
                                <SelectTrigger id="vehicleDirection"><SelectValue/></SelectTrigger>
                                <SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => handleManualScan('vehicle')} disabled={isLoading || !manualPlate} className="w-full">
                            {isLoading && scanResult.type === 'vehicle' ? <LoadingSpinner size={16} className="mr-2"/> : null} Log Vehicle
                        </Button>
                        {scanResult.type === 'vehicle' && scanResult.message && !isLoading && (
                             <p className={`mt-2 text-xs ${scanResult.message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{scanResult.message}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Manual Face Scan Simulation */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5"/> Manual Person Log (Face Scan Sim.)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label htmlFor="manualPersonId">Person DB ID (User/Worker `_id`)</Label><Input id="manualPersonId" value={manualPersonId} onChange={(e) => setManualPersonId(e.target.value)} placeholder="Enter MongoDB _id" /></div>
                        <div><Label htmlFor="manualPersonType">Person Type</Label><Select value={manualPersonType} onValueChange={setManualPersonType}><SelectTrigger id="manualPersonType"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="user">Resident</SelectItem><SelectItem value="worker">Staff</SelectItem></SelectContent></Select></div>
                        <div><Label htmlFor="faceDirection">Direction</Label><Select value={faceDirection} onValueChange={setFaceDirection}><SelectTrigger id="faceDirection"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem></SelectContent></Select></div>
                        <Button onClick={() => handleManualScan('face')} disabled={isLoading || !manualPersonId} className="w-full">
                            {isLoading && scanResult.type === 'face' ? <LoadingSpinner size={16} className="mr-2"/> : null} Log Person
                        </Button>
                         {scanResult.type === 'face' && scanResult.message && !isLoading && (
                             <p className={`mt-2 text-xs ${scanResult.message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{scanResult.message}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}