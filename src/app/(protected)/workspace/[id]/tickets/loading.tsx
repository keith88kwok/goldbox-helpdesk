import { LoadingCard, LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TicketsLoading() {
    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header Loading */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Navigation */}
                <div className="flex items-center">
                    <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                
                {/* Title and Create Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
            </div>

            {/* Search and Filters Loading */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Loading State with Spinner */}
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner 
                    size="lg" 
                    text="Loading tickets..." 
                />
            </div>

            {/* Skeleton Cards Grid */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
                {[...Array(6)].map((_, i) => (
                    <LoadingCard key={i} />
                ))}
            </div>
        </div>
    );
} 