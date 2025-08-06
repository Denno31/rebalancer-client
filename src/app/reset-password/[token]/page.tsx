"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/Card";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ResetPassword() {
    const params = useParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        // Get token from URL parameter and validate it
        async function validateToken() {
            if (params && params.token) {
                const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;
                setToken(tokenParam);
                
                try {
                    // Validate token with the API
                    const { validateResetToken } = await import('@/utils/api');
                    const { valid } = await validateResetToken(tokenParam);
                    
                    setValidatingToken(false);
                    setTokenValid(valid);
                    
                    if (!valid) {
                        setError("Invalid or expired reset link. Please request a new password reset.");
                    }
                } catch (err) {
                    setValidatingToken(false);
                    setTokenValid(false);
                    setError("Error validating reset link. Please request a new password reset.");
                }
            } else {
                setValidatingToken(false);
                setTokenValid(false);
                setError("Invalid reset link. Please request a new password reset.");
            }
        }
        
        validateToken();
    }, [params]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate passwords
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        
        if (!token) {
            setError("Invalid reset token");
            return;
        }
        
        setError(null);
        setLoading(true);
        
        try {
            // Connect with the API to reset password
            const { resetPassword } = await import('@/utils/api');
            await resetPassword(token, password);
            
            setSuccess(true);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (validatingToken) {
            return (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating your reset link...</p>
                </div>
            );
        }

        if (!tokenValid) {
            return (
                <div className="text-center py-6">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                        {error || "Invalid or expired password reset link."}
                    </div>
                    <Link 
                        href="/forgot-password" 
                        className="text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                        Request a new password reset
                    </Link>
                </div>
            );
        }

        if (success) {
            return (
                <div className="text-center py-6">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                        Password successfully reset! You will be redirected to the login page.
                    </div>
                    <Link 
                        href="/login" 
                        className="text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                        Go to Login
                    </Link>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter your new password"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Confirm your new password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                    {loading ? "Resetting password..." : "Reset Password"}
                </button>
            </form>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-yellow-500 mb-2">Crypto Rebalancer</h1>
                    <p className="text-gray-300">Professional Trading Tools</p>
                </div>

                <Card>
                    <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
                        Set New Password
                    </h2>
                    
                    {renderContent()}
                </Card>
                
                <div className="text-center mt-8 text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Crypto Rebalancer. All rights reserved.
                </div>
            </div>
        </div>
    );
}
