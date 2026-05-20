import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Mail, User, Calendar, Shield, LogOut } from "lucide-react"
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'

export function Profile() {
  const navigate = useNavigate()
  const { session, profile, user, loading: authLoading } = useAuth()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [role, setRole] = useState("buyer")
  const [email, setEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setPhone(profile.phone || "")
      setAvatarUrl(profile.avatar_url || "")
      setRole(profile.role || "buyer")
    }
    if (user) {
      setEmail(user.email || "")
    }
  }, [profile, user])

  // Redirect if not logged in
  if (!authLoading && !session) {
    navigate('/login')
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError
      setSuccessMsg("Avatar updated successfully!")
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName || !user?.id) {
      setErrorMsg("Full name is required")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      console.log("Updating profile for user:", user.id, { full_name: fullName, phone })

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()

      if (error) {
        console.error("Supabase error:", error)
        throw new Error(error.message || "Failed to update profile")
      }

      console.log("Profile updated:", data)
      setSuccessMsg("Profile updated successfully!")
      setIsEditing(false)
      
      // Refresh halaman setelah 2 detik
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error("Update error:", error)
      setErrorMsg(error.message || "Failed to update profile. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Alert Messages */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-6">
          {/* Avatar & Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture & Information</CardTitle>
              <CardDescription>Update your profile picture and basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-primary text-white text-lg font-bold">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{fullName || "Your Name"}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={role === 'organizer' ? 'default' : 'secondary'}>
                      {role === 'organizer' ? 'Event Organizer' : 'Buyer'}
                    </Badge>
                    {profile?.created_at && (
                      <Badge variant="outline">
                        <Calendar size={12} className="mr-1" />
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <hr className="bg-border" />

              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 8XX XXXX XXXX"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">
                        Full Name
                      </Label>
                      <p className="text-foreground font-medium mt-1">{fullName || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">
                        Phone
                      </Label>
                      <p className="text-foreground font-medium mt-1">{phone || "Not set"}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Account Information
              </CardTitle>
              <CardDescription>Your account details and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">
                    Email
                  </Label>
                  <p className="text-foreground font-medium mt-1 flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    {email}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">
                    Role
                  </Label>
                  <p className="text-foreground font-medium mt-1 flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    {role === 'organizer' ? 'Event Organizer' : 'Buyer'}
                  </p>
                </div>
              </div>

              {profile?.created_at && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">
                    Member Since
                  </Label>
                  <p className="text-foreground font-medium mt-1 flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    {new Date(profile.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <LogOut size={20} />
                Danger Zone
              </CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="mr-2" size={18} />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
