"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import Link from "next/link";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            // Connect with the API
            const { requestPasswordReset } = await import('@/utils/api');
            await requestPasswordReset(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to request password reset");
        } finally {
            setLoading(false);
        }
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
                        Reset Your Password
                    </h2>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                                Password reset link sent! Check your email for instructions.
                            </div>
                            <Link 
                                href="/login" 
                                className="text-yellow-600 hover:text-yellow-800 font-medium"
                            >
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <p className="text-gray-600 mb-4">
                                    Enter your email address below. We&apos;ll send you a link to reset your password.
                                </p>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                            >
                                {loading ? "Please wait..." : "Request Password Reset"}
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="text-center mt-4">
                            <Link href="/login" className="text-gray-600 hover:text-gray-800 text-sm">
                                Back to Login
                            </Link>
                        </div>
                    )}
                </Card>
                
                <div className="text-center mt-8 text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Crypto Rebalancer. All rights reserved.
                </div>
            </div>
        </div>
    );
}
