"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
    showPassword?: boolean;
    onTogglePassword?: () => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, showPassword: controlledShowPassword, onTogglePassword, ...props }, ref) => {
        const [localShowPassword, setLocalShowPassword] = React.useState(false);

        const isPasswordVisible = controlledShowPassword !== undefined ? controlledShowPassword : localShowPassword;
        const toggleVisibility = onTogglePassword || (() => setLocalShowPassword((prev) => !prev));

        return (
            <div className="relative">
                <Input
                    type={isPasswordVisible ? "text" : "password"}
                    className={cn("pr-10", className)}
                    ref={ref}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white transition-colors"
                    onClick={toggleVisibility}
                    tabIndex={-1}
                >
                    {isPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                        {isPasswordVisible ? "Şifreyi gizle" : "Şifre göster"}
                    </span>
                </Button>
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
