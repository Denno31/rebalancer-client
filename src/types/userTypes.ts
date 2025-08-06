export interface User {
    id: number;
    email: string;
    username: string;
    isActive: boolean;
    isSuperuser: boolean;
    resetToken?: string;
    resetTokenExpiry?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserLogin {
    username: string;
    password: string;
}

export interface UserRegistration extends UserLogin {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
}

export interface ResetPasswordConfirm {
    token: string;
    password: string;
}
