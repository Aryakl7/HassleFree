// FILE: app/admin/login/page.jsx
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

      // --- Extract both token and societyId ---
      const { accessToken, societyId, status } = response.data;

      if (status === 'success' && accessToken && societyId) {
        // --- Store BOTH tokens in cookies ---
        const cookieOptions = {
            expires: 7, // Example: 7 days
            secure: process.env.NODE_ENV === 'test', // Use secure cookies in production
            sameSite: 'lax' // Recommended for security
        };
        console.log("Setting AdminAccessToken cookie:", accessToken);
        Cookies.set('AdminAccessToken', accessToken, cookieOptions);
        console.log("Setting SocietyId cookie:", societyId);
        Cookies.set('SocietyId', societyId, cookieOptions); // <-- STORE SOCIETY ID

        toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
        router.push('/admin/dashboard'); // Redirect to dashboard
      } else {
         // Handle cases where API might return success but missing data
         throw new Error(response.data.message || "Login failed: Invalid response from server.");
      }

    } catch (error) {
      console.error("Admin Login Failed:", error.response?.data || error.message);
      toast({
          title: "Login Failed",
          description: error.response?.data?.message || "Incorrect email or password.", // More specific error
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
                    value={email} // Control input value
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading} // Disable during loading
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
                    value={password} // Control input value
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading} // Disable during loading
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
              {/* Update links if needed */}
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
          {/* ... graphic content ... */}
      </div>
    </div>
  )
}