import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wrench, Eye, EyeOff, Mail } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Login3D() {
  const { login, isLoading, error, user } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      setResetMessage(data.message);
      
      if (response.ok) {
        setResetEmail("");
        setTimeout(() => {
          setShowPasswordReset(false);
          setResetMessage("");
        }, 3000);
      }
    } catch (error) {
      setResetMessage("Network error occurred. Please try again.");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(https://res.cloudinary.com/dkw9qeb5y/image/upload/v1747632238/o1v8bwlfau8hltgictny.jpg)'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Back to Home */}
      <Link to="/" className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur border hover:bg-white text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Link>

      {/* Main Container */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {/* Ads banner above login */}
          <div className="mb-4">
            {/* eslint-disable-next-line react/jsx-no-undef */}
            <AdBanner placement="login" />
          </div>
          {/* Main Login Card */}
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-red-500 via-gray-400 to-black text-white relative">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float animate-glow">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold animate-slide-in">
                Welcome to the BlockBusters Private Client App
              </CardTitle>
              <p className="text-white/90 text-sm animate-slide-in" style={{ animationDelay: '0.2s' }}>
                Access your professional job management system
              </p>
            </CardHeader>

            <CardContent className="space-y-6 p-8">
              {!showPasswordReset ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 font-medium">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials({ ...credentials, username: e.target.value })
                      }
                      placeholder="Enter your username or email"
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500/20 rounded-2xl py-3 px-4"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({ ...credentials, password: e.target.value })
                        }
                        placeholder="Enter your password"
                        className="border-gray-300 focus:border-red-500 focus:ring-red-500/20 rounded-2xl py-3 px-4 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-red-500 via-gray-400 to-black hover:from-red-600 hover:via-gray-500 hover:to-gray-900 text-white font-semibold py-4 transition-all duration-300 transform hover:scale-105 shadow-lg rounded-3xl" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Wrench className="mr-2 h-5 w-5" />
                        Login
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Password</h3>
                    <p className="text-sm text-gray-600">Enter your username or email to receive a password reset link</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-gray-700 font-medium">Username or Email</Label>
                    <Input
                      id="resetEmail"
                      type="text"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your username or email"
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500/20 rounded-2xl py-3 px-4"
                      required
                    />
                  </div>

                  {resetMessage && (
                    <Alert className={`rounded-2xl ${resetMessage.includes('error') || resetMessage.includes('Error') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <AlertDescription className={resetMessage.includes('error') || resetMessage.includes('Error') ? 'text-red-700' : 'text-green-700'}>
                        {resetMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-red-500 via-gray-400 to-black hover:from-red-600 hover:via-gray-500 hover:to-gray-900 text-white font-semibold py-3 transition-all duration-300 rounded-2xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setResetMessage("");
                        setResetEmail("");
                      }}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl py-3"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>Secure access to your professional workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
