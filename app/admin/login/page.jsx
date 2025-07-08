'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, ShieldIcon } from 'lucide-react'
import Cookies from 'js-cookie'
import axios from 'axios';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const router = useRouter()
  const { toast } = useToast(); // Initialize toast

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/login`,
        { email, password }
      );

      const { accessToken, societyId, status } = response.data;

      if (status === 'success' && accessToken && societyId) {
        const cookieOptions = {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        };
        Cookies.set('AdminAccessToken', accessToken, cookieOptions);
        Cookies.set('SocietyId', societyId, cookieOptions);

        toast({ title: "Login Successful", description: "Redirecting to admin dashboard..." });
        // --- CORRECT REDIRECT PATH ---
        router.push('/admin/dashboard'); // <--- FIX HERE
        // -----------------------------
      } else {
         throw new Error(response.data.message || "Login failed: Invalid response from server.");
      }

    } catch (error) {
      console.error("Admin Login Failed:", error.response?.data || error.message);
      toast({
          title: "Login Failed",
          description: error.response?.data?.message || "Incorrect email or password.",
          variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Admin Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log in to Admin Dashboard'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center justify-between w-full">
               {/* Make sure these links exist or remove them */}
              <Link href="/admin/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
              <Link href="/user/login" className="text-sm text-primary hover:underline">
                User Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Admin Graphic Section (no changes needed here) */}
      <div className="flex-1 bg-gradient-to-br from-primary to-green-600 hidden md:flex items-center justify-center p-8">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">Powerful Admin Tools at Your Fingertips</h2>
          <p className="text-xl mb-8">
            Access the HassleFree admin dashboard to manage your residential communities efficiently.
            Streamline operations and enhance resident satisfaction with our comprehensive suite of tools.
          </p>
           {/* Graphic Icons (no changes needed) */}
           <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center">
               <ShieldIcon className="h-8 w-8 mr-3" />
               <span>Enhanced Security</span>
             </div>
             <div className="flex items-center">
               <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
               </svg>
               <span>Comprehensive Reports</span>
             </div>
             <div className="flex items-center">
               <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span>Real-time Monitoring</span>
             </div>
             <div className="flex items-center">
               <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <span>Advanced Settings</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}