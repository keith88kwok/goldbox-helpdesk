import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NewTicketLoading() {
    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header Loading */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Navigation */}
                <div className="flex items-center">
                    <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                
                {/* Title */}
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
            </div>

            {/* Loading State with Spinner */}
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner 
                    size="lg" 
                    text="Preparing form..." 
                />
            </div>

            {/* Form Loading */}
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="space-y-6">
                        {/* Form Fields */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-24"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                        ))}
                        
                        {/* File Upload Area */}
                        <div className="space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-32"></div>
                            <div className="h-32 bg-gray-200 rounded border-2 border-dashed"></div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <div className="h-10 bg-gray-200 rounded w-20"></div>
                            <div className="h-10 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 