"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import Link from "next/link";

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Connect with your API
            if (isLogin) {
                // Handle login
                const { login } = await import('@/utils/api');
                await login(formData.username, formData.password);
                // Redirect to dashboard after successful login
                window.location.href = '/'; // Will redirect to the dashboard root
            } else {
                // Handle registration
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                
                const { register } = await import('@/utils/api');
                await register(formData.email, formData.username, formData.password);
                
                // Show success message and switch to login view
                setIsLogin(true);
                setFormData({
                    ...formData,
                    password: '',
                    confirmPassword: ''
                });
                setError("Registration successful. Please login with your new credentials.");
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
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
                        {isLogin ? "Login" : "Create Account"}
                    </h2>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required={!isLogin}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {!isLogin && (
                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required={!isLogin}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                        >
                            {loading ? "Please wait..." : (isLogin ? "Login" : "Register")}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                            disabled={loading}
                        >
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>

                        {isLogin && (
                            <div className="mt-2">
                                <Link href="/forgot-password" className="text-gray-600 hover:text-gray-800 text-sm">
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>
                </Card>
                
                <div className="text-center mt-8 text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Crypto Rebalancer. All rights reserved.
                </div>
            </div>
        </div>
    );
}
