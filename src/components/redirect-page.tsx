'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Home, LogIn, Building2, Clock } from 'lucide-react';

interface RedirectPageProps {
    title: string;
    reason: string;
    description?: string;
    targetUrl: string;
    buttonText: string;
    icon?: 'error' | 'auth' | 'workspace' | 'info';
    autoRedirectSeconds?: number;
    showCancelOption?: boolean;
    onCancel?: () => void;
}

const getIcon = (type: string) => {
    switch (type) {
        case 'error':
            return <AlertCircle className="h-12 w-12 text-red-500" />;
        case 'auth':
            return <LogIn className="h-12 w-12 text-blue-500" />;
        case 'workspace':
            return <Building2 className="h-12 w-12 text-purple-500" />;
        default:
            return <Home className="h-12 w-12 text-gray-500" />;
    }
};

export function RedirectPage({
    title,
    reason,
    description,
    targetUrl,
    buttonText,
    icon = 'info',
    autoRedirectSeconds,
    showCancelOption = false,
    onCancel
}: RedirectPageProps) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(autoRedirectSeconds || 0);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (autoRedirectSeconds && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (autoRedirectSeconds && countdown === 0) {
            handleRedirect();
        }
    }, [countdown, autoRedirectSeconds]);

    const handleRedirect = () => {
        setIsRedirecting(true);
        router.push(targetUrl);
    };

    const handleCancel = () => {
        setCountdown(0); // Stop auto-redirect
        if (onCancel) {
            onCancel();
        } else {
            router.back(); // Go back if no cancel handler provided
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {getIcon(icon)}
                    </div>
                    <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                    <CardDescription className="text-base">{reason}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {description && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">{description}</p>
                        </div>
                    )}

                    {autoRedirectSeconds && countdown > 0 && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center mb-2">
                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-600">
                                    Auto-redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                    style={{ 
                                        width: `${((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button 
                            onClick={handleRedirect} 
                            className="w-full"
                            disabled={isRedirecting}
                        >
                            {isRedirecting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    {buttonText}
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>

                        {showCancelOption && countdown > 0 && (
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                className="w-full"
                            >
                                Cancel Auto-Redirect
                            </Button>
                        )}

                        {showCancelOption && !autoRedirectSeconds && (
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                className="w-full"
                            >
                                Go Back
                            </Button>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Target: <code className="bg-gray-100 px-1 rounded">{targetUrl}</code>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 