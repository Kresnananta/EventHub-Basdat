import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Ticket, Mail, Lock, ArrowRight } from "lucide-react"

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const navigate = useNavigate()
  const { session } = useAuth()

  // Jika sudah punya sesi, lemparkan dia ke Landing Page (bukan dashboard)
  if (session) {
    return <Navigate to="/" replace />
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) setErrorMsg(error.message)
      else setSuccessMsg("Registration successful! Please check your email to confirm your account.")
    }
    else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) setErrorMsg("Email or Password wrong")
      else {
        setSuccessMsg("Mengalihkan ke halaman utama...")
        setTimeout(() => {
          navigate("/")
        }, 1200)
      }
    }
    setLoading(false)
  }

  // SSO Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    if (error) setErrorMsg(error.message)
  }

  return (
    <div className="min-h-screen flex w-full">
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"
          alt="Concert"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        <div className="relative z-20 text-white p-12 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary text-white p-2.5 rounded-lg shadow-lg">
              <Ticket size={28} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">EventHub</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Find your next big moment with <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EventHub</span></h1>
          <p className="text-lg text-white mb-8">Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quia magnam perferendis omnis nam quidem recusandae, repellendus odit velit dolor?</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-8 relative">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? "Skip the line, get tickets online" : "Sign in to your account to continue"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-emerald-200 text-emerald-600 rounded-md text-sm font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <Label>Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Cena"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-50 focus-visible:ring-primary/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-50 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-50 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-2 h-11 text-[15px] cursor-pointer" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : null}
              {isSignUp ? "Sign Up" : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground tracking-widest">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full font-medium shadow-sm h-11 bg-white hover:bg-slate-50 cursor-pointer"
            onClick={handleGoogleLogin}
          >
            {/* SVG Google */}
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google SSO
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Sign up for free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}