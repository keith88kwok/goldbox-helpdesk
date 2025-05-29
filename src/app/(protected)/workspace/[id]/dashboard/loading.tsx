import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardLoading() {
    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header Loading */}
            <div className="mb-6 sm:mb-8">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>

            {/* Stats Cards Loading */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                ))}
            </div>

            {/* Loading State with Spinner */}
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner 
                    size="lg" 
                    text="Loading dashboard..." 
                />
            </div>

            {/* Quick Actions and Recent Activity Loading */}
            <div className="grid gap-6 lg:grid-cols-2 mt-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start space-x-3">
                                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 