import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TeamLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Loading */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                                <div>
                                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Main Content Loading */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Title Loading */}
                <div className="mb-6 sm:mb-8">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Search Loading */}
                <div className="mb-6">
                    <div className="h-10 w-full max-w-md bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Loading State with Spinner */}
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner 
                        size="lg" 
                        text="Loading team members..." 
                    />
                </div>

                {/* Member Cards Loading */}
                <div className="space-y-4 mt-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3 flex-1">
                                    {/* Avatar */}
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200"></div>
                                    
                                    {/* Member Info */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                </div>

                                {/* Role and Actions */}
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 