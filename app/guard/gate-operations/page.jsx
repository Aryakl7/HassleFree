'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, LogIn, LogOut, ScanLine, Car, UserCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';


const GATE_LOCATION = "Main Gate North"; // Example, could be dynamic

export default function GuardGateOperationsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [manualPlate, setManualPlate] = useState('');
    const [manualDirection, setManualDirection] = useState('entry');
    const [manualPersonId, setManualPersonId] = useState('');
    const [manualPersonType, setManualPersonType] = useState('user');


    // --- QR Scanner ---
    const qrScannerRef = useRef(null);
    useEffect(() => {
        if (qrScannerRef.current && !qrScannerRef.current.innerHTML) { // Prevent re-initialization
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader-element", // ID of the div
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedFormats: [Html5QrcodeSupportedFormats.QR_CODE],
                    rememberLastUsedCamera: true,
                },
                false
            );

            const onScanSuccess = async (decodedText, decodedResult) => {
                html5QrcodeScanner.pause(true); // Pause after scan
                console.log(`QR Scanned: ${decodedText}`);
                setLastScanResult(`QR: ${decodedText.substring(0, 50)}...`);
                setIsLoading(true);
                try {
                    // TODO: Ensure POST /api/gate/verify-qr API exists
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/verify-qr`, { qrDataString: decodedText });
                    toast({ title: "QR Verified", description: response.data.message });
                    setLastScanResult(`Success: ${response.data.message}`);
                    // html5QrcodeScanner.clear(); // To stop scanner fully, but might remove element
                } catch (error) {
                    const errorMsg = error.response?.data?.error || "QR verification failed.";
                    toast({ title: "QR Error", description: errorMsg, variant: "destructive" });
                    setLastScanResult(`Error: ${errorMsg}`);
                } finally {
                    setIsLoading(false);
                    setTimeout(() => html5QrcodeScanner.resume(), 2000); // Resume after a delay
                }
            };
            const onScanFailure = (error) => { /* console.warn(`QR Scan Error: ${error}`); */ };
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        }
        // return () => { if (html5QrcodeScanner?.getState()) html5QrcodeScanner.clear(); };
    }, []);

    const handleManualScan = async (scanType) => {
        setIsLoading(true);
        setLastScanResult(null);
        let apiUrl = '';
        let payload = {};

        if (scanType === 'vehicle') {
            if (!manualPlate) { toast({ title: "Input Error", description: "Please enter license plate.", variant: "destructive"}); setIsLoading(false); return; }
            apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/vehicle-scan`;
            payload = { plateNumber: manualPlate, direction: manualDirection, gateLocation: GATE_LOCATION };
        } else if (scanType === 'face') {
            if (!manualPersonId) { toast({ title: "Input Error", description: "Please enter Person ID for face scan simulation.", variant: "destructive"}); setIsLoading(false); return; }
            apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/gate/face-scan`;
            payload = { identifiedPersonId: manualPersonId, personType: manualPersonType, direction: manualDirection, gateLocation: GATE_LOCATION };
        } else {
            setIsLoading(false); return;
        }

        try {
            const response = await axios.post(apiUrl, payload /*, { headers: { Authorization: `Bearer GUARD_TOKEN` }} */);
            toast({ title: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan Processed`, description: response.data.message });
            setLastScanResult(`Success: ${response.data.message}`);
            setManualPlate(''); setManualPersonId(''); // Clear inputs
        } catch (error) {
            const errorMsg = error.response?.data?.error || `Failed to process ${scanType} scan.`;
            toast({ title: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan Error`, description: errorMsg, variant: "destructive" });
            setLastScanResult(`Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center">Gate Operations ({GATE_LOCATION})</h1>

            {/* QR Code Scanner Section */}
            <Card>
                <CardHeader><CardTitle className="flex items-center"><ScanLine className="mr-2"/> QR Code Scanner</CardTitle></CardHeader>
                <CardContent>
                    <div id="qr-reader-element" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}></div>
                    {isLoading && lastScanResult?.startsWith('QR:') && <div className="text-center mt-2"><LoadingSpinner /> Processing QR...</div>}
                    {lastScanResult && <p className="mt-2 text-sm text-center">Last Scan: {lastScanResult}</p>}
                </CardContent>
            </Card>

            {/* Manual Vehicle Entry Simulation */}
            <Card>
                <CardHeader><CardTitle className="flex items-center"><Car className="mr-2"/> Manual Vehicle Scan</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div><Label htmlFor="manualPlate">License Plate</Label><Input id="manualPlate" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase())} placeholder="ABC1234" /></div>
                    <div>
                        <Label htmlFor="vehicleDirection">Direction</Label>
                        <Select value={manualDirection} onValueChange={setManualDirection}><SelectTrigger id="vehicleDirection"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem></SelectContent></Select>
                    </div>
                    <Button onClick={() => handleManualScan('vehicle')} disabled={isLoading} className="w-full">
                        {isLoading ? <LoadingSpinner size={16}/> : "Log Vehicle"}
                    </Button>
                </CardContent>
            </Card>

            {/* Manual Face Scan Simulation */}
            <Card>
                <CardHeader><CardTitle className="flex items-center"><UserCircle className="mr-2"/> Manual Face Scan (Simulated)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div><Label htmlFor="manualPersonId">Person DB ID (User/Worker _id)</Label><Input id="manualPersonId" value={manualPersonId} onChange={(e) => setManualPersonId(e.target.value)} placeholder="Enter MongoDB _id" /></div>
                    <div><Label htmlFor="manualPersonType">Person Type</Label><Select value={manualPersonType} onValueChange={setManualPersonType}><SelectTrigger id="manualPersonType"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="user">Resident</SelectItem><SelectItem value="worker">Staff</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="faceDirection">Direction</Label><Select value={manualDirection} onValueChange={setManualDirection}><SelectTrigger id="faceDirection"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem></SelectContent></Select></div>
                    <Button onClick={() => handleManualScan('face')} disabled={isLoading} className="w-full">
                         {isLoading ? <LoadingSpinner size={16}/> : "Log Face Scan"}
                    </Button>
                </CardContent>
            </Card>

            {/* Display area for last action result, useful for real hardware integration */}
            {/* <div className="mt-4 p-4 border rounded bg-muted text-sm">
                <strong>Last Action Result:</strong> {lastScanResult || "None"}
            </div> */}
        </div>
    );
}