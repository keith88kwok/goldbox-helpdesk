import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function WorkspacesLoading() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Loading */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="h-10 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-72 mx-auto animate-pulse"></div>
                </div>

                {/* Loading State with Spinner */}
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner 
                        size="lg" 
                        text="Loading your workspaces..." 
                    />
                </div>

                {/* Workspace Cards Loading */}
                <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-8">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow animate-pulse">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Stats Loading */}
                <div className="mt-12 grid gap-4 sm:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 text-center animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 