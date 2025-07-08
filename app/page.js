'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Users, Bell, FileText, QrCode, MessageSquare, Calendar, Camera, ClipboardList, UserPlus, UserMinus, Car, Briefcase, Users as UsersIcon, Shield, Settings, CreditCard, ChartBar, Map, Phone, Lock, Zap, Smile, CheckCircle, Star, ArrowRight } from 'lucide-react'
import Cookies from 'js-cookie'
import AdminLoginPage from './admin/login/page'
import AdminSignupPage from './admin/signup/page'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('admin')
  const [hasUserToken, setHasUserToken] = useState(false)
  const [hasAdminToken, setHasAdminToken] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userToken = Cookies.get('UserAccessToken')
    const adminToken = Cookies.get('AdminAccessToken')
    const storeId = Cookies.get('StoreId') 
    setHasUserToken(!!userToken && !!storeId)
    setHasAdminToken(!!adminToken)
  }, [])

  const handleGetStarted = () => {
    if (hasUserToken) {
      router.push('/user/dashboard')
    } else {
      router.push('/user/login')
    }
  }

  const handleAdminDashboard = () => {
    if (hasAdminToken) {
      router.push('/admin/dashboard')
    } else {
      router.push('/admin/login')
    }
  }

  const handleUserDashboard = () => {
    if (hasUserToken) {
      router.push('/user/dashboard')
    } else {
      router.push('/user/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">HassleFree</h1>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-foreground">Features</Link>
            <Link href="#benefits" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-foreground">Benefits</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-foreground">Testimonials</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-foreground">Pricing</Link>
          </nav>
          <Button onClick={handleGetStarted}>Get Started</Button>
        </div>
      </header>

      <main>
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Simplify Your Community Management
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              HassleFree revolutionizes residential society management with powerful tools for admins and residents alike.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button size="lg" className="text-lg py-6 px-8" onClick={handleAdminDashboard}>
                Go to Admin Dashboard
              </Button>
              <Button size="lg" variant="outline" className="text-lg py-6 px-8" onClick={handleUserDashboard}>
                Go to User Dashboard
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Tailored Solutions for Everyone</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
                <TabsTrigger value="admin" className="text-lg py-3">For Admins</TabsTrigger>
                <TabsTrigger value="user" className="text-lg py-3">For Residents</TabsTrigger>
              </TabsList>
              <TabsContent value="admin">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <FeatureCard
                    icon={<Building2 className="h-8 w-8 text-primary" />}
                    title="Comprehensive Society Management"
                    description="Effortlessly manage multiple properties, units, and common areas from a centralized dashboard. Our intuitive interface streamlines all aspects of society administration."
                  />
                  <FeatureCard
                    icon={<Bell className="h-8 w-8 text-primary" />}
                    title="Advanced Notice Management"
                    description="Keep everyone informed with our powerful notification system. Schedule, target, and track important announcements with ease."
                  />
                  <FeatureCard
                    icon={<FileText className="h-8 w-8 text-primary" />}
                    title="Dynamic Form Builder"
                    description="Create custom forms for surveys, feedback, or data collection using our drag-and-drop builder. Implement conditional logic for complex data gathering."
                  />
                  <FeatureCard
                    icon={<UserPlus className="h-8 w-8 text-primary" />}
                    title="Streamlined Resident Management"
                    description="Efficiently handle move-ins, move-outs, and profile updates. Assign roles and manage access with our robust user management system."
                  />
                  <FeatureCard
                    icon={<ClipboardList className="h-8 w-8 text-primary" />}
                    title="Comprehensive Entry Logs"
                    description="Maintain detailed records of all entries and exits. Generate insightful reports to enhance community security and operations."
                  />
                  <FeatureCard
                    icon={<CreditCard className="h-8 w-8 text-primary" />}
                    title="Financial Management Suite"
                    description="Take control of society finances with our comprehensive tools for tracking dues, generating invoices, and managing payments."
                  />
                </div>
              </TabsContent>
              <TabsContent value="user">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <FeatureCard
                    icon={<QrCode className="h-8 w-8 text-primary" />}
                    title="Seamless Visitor Management"
                    description="Simplify guest entry with QR code-based visitor passes. Pre-authorize visitors and receive real-time arrival notifications."
                  />
                  <FeatureCard
                    icon={<MessageSquare className="h-8 w-8 text-primary" />}
                    title="Efficient Complaint Resolution"
                    description="Submit and track complaints with ease. Our system ensures swift issue resolution and allows you to rate the service quality."
                  />
                  <FeatureCard
                    icon={<Bell className="h-8 w-8 text-primary" />}
                    title="Interactive Community Notice Board"
                    description="Stay informed with our dynamic notice board. Receive personalized notifications and engage in community discussions."
                  />
                  <FeatureCard
                    icon={<Calendar className="h-8 w-8 text-primary" />}
                    title="Convenient Amenity Booking"
                    description="Book community amenities with real-time availability. Manage your reservations and receive timely reminders."
                  />
                  <FeatureCard
                    icon={<Users className="h-8 w-8 text-primary" />}
                    title="Vibrant Community Forum"
                    description="Connect with neighbors, join interest groups, and organize community events to foster a sense of belonging."
                  />
                  <FeatureCard
                    icon={<Phone className="h-8 w-8 text-primary" />}
                    title="Emergency Services Hub"
                    description="Access critical contacts and services quickly. Use our SOS feature to notify security or emergency services instantly."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <section id="benefits" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Why Choose HassleFree?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <BenefitCard
                icon={<Zap className="h-8 w-8 text-yellow-500" />}
                title="Unparalleled Efficiency"
                description="Streamline operations and automate routine tasks, saving time and reducing administrative burden."
              />
              <BenefitCard
                icon={<MessageSquare className="h-8 w-8 text-blue-500" />}
                title="Enhanced Communication"
                description="Foster transparent and effective communication between residents and management across multiple channels."
              />
              <BenefitCard
                icon={<Lock className="h-8 w-8 text-green-500" />}
                title="Robust Security"
                description="Elevate community safety with advanced visitor management and emergency response features."
              />
              <BenefitCard
                icon={<ChartBar className="h-8 w-8 text-purple-500" />}
                title="Data-Driven Insights"
                description="Make informed decisions with comprehensive analytics on community trends and operational efficiency."
              />
              <BenefitCard
                icon={<Users className="h-8 w-8 text-red-500" />}
                title="Stronger Community Bonds"
                description="Build a more connected and engaged community through social features and event management tools."
              />
              <BenefitCard
                icon={<Smile className="h-8 w-8 text-orange-500" />}
                title="Exceptional User Experience"
                description="Enjoy an intuitive interface designed for users of all tech levels, with responsive support when you need it."
              />
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard
                quote="HassleFree has transformed how we manage our community. It's intuitive, powerful, and has greatly improved resident satisfaction."
                author="Sarah Johnson"
                role="Property Manager"
              />
              <TestimonialCard
                quote="As a resident, I love how easy it is to book amenities and stay updated on community events. It's made living here so much more enjoyable!"
                author="Michael Chen"
                role="Resident"
              />
              <TestimonialCard
                quote="The financial management tools have streamlined our accounting processes. We've saved countless hours and improved our financial transparency."
                author="David Rodriguez"
                role="HOA Treasurer"
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <PricingCard
                title="Basic"
                price="$99"
                period="/month"
                features={[
                  "Up to 100 units",
                  "Core management features",
                  "Community forum",
                  "Email support"
                ]}
              />
              <PricingCard
                title="Pro"
                price="$199"
                period="/month"
                features={[
                  "Up to 250 units",
                  "All Basic features",
                  "Advanced analytics",
                  "Priority support"
                ]}
                highlighted={true}
              />
              <PricingCard
                title="Enterprise"
                price="Custom"
                period=""
                features={[
                  "Unlimited units",
                  "All Pro features",
                  "Custom integrations",
                  "Dedicated account manager"
                ]}
              />
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Community?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of thriving communities that have revolutionized their management with HassleFree.
            </p>
            <Button size="lg" variant="secondary" className="text-lg py-6 px-8">
              Start Your Free Trial Today
            </Button>
          </div>
          <AdminSignupPage/>
        </section>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Features</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Pricing</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">About Us</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Careers</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Blog</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Help Center</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} HassleFree. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {icon}
          <span className="ml-3">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function BenefitCard({ icon, title, description }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {icon}
          <span className="ml-3">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ quote, author, role }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <Star className="h-6 w-6 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="text-lg italic mb-4">&ldquo;{quote}&rdquo;</blockquote>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
      </CardContent>
    </Card>
  )
}

function PricingCard({ title, price, period, features, highlighted = false }) {
  return (
    <Card className={`transition-all duration-300 ${highlighted ? 'border-primary shadow-lg scale-105' : 'hover:shadow-lg'}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="text-3xl font-bold mt-2">
          {price}<span className="text-lg font-normal text-gray-600 dark:text-gray-400">{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              {feature}
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={highlighted ? 'default' : 'outline'}>
          Choose Plan
        </Button>
      </CardContent>
    </Card>
  )
}