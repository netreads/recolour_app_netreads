'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Download, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface SearchResult {
  orderId: string;
  phonepeOrderId: string | null;
  orderStatus: string;
  coloredImageUrl: string | null;
  originalUrl: string;
  jobStatus: string;
  jobCreatedAt: string;
  isPaid: boolean;
}

interface SearchResponse {
  success: boolean;
  count: number;
  results: SearchResult[];
}

export default function SearchOrdersPage() {
  const [searchType, setSearchType] = useState<'orderId' | 'phonepeOrderId'>('orderId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const param = searchType === 'orderId' ? 'orderId' : 'phonepeOrderId';
      const response = await fetch(`/api/admin/search-orders?${param}=${encodeURIComponent(searchValue)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search orders');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      
      if (data.count === 0) {
        setError('No paid jobs found matching your search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    if (!imageUrl) {
      alert('Image URL not available');
      return;
    }

    setDownloading(imageUrl);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to download image. Please try again.');
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Search Paid Orders</h1>
            <p className="text-muted-foreground">
              Search for orders by Order ID or PhonePe Order ID and view/download paid images
            </p>
          </div>

          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle>Search Orders</CardTitle>
              <CardDescription>
                Enter an Order ID or PhonePe Order ID to find associated paid jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={searchType === 'orderId' ? 'default' : 'outline'}
                  onClick={() => setSearchType('orderId')}
                  className="flex-1"
                >
                  Order ID
                </Button>
                <Button
                  variant={searchType === 'phonepeOrderId' ? 'default' : 'outline'}
                  onClick={() => setSearchType('phonepeOrderId')}
                  className="flex-1"
                >
                  PhonePe Order ID
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={searchType === 'orderId' ? 'Enter Order ID (e.g., 05448)' : 'Enter PhonePe Order ID'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchValue.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Results ({results.length})</CardTitle>
                <CardDescription>
                  Found {results.length} paid job{results.length !== 1 ? 's' : ''} matching your search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.map((result, index) => (
                    <div
                      key={`${result.orderId}-${index}`}
                      className="border rounded-lg p-4 space-y-4 bg-white"
                    >
                      {/* Order Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Order ID:</span>{' '}
                          <span className="text-muted-foreground font-mono">{result.orderId}</span>
                        </div>
                        {result.phonepeOrderId && (
                          <div>
                            <span className="font-semibold">PhonePe Order ID:</span>{' '}
                            <span className="text-muted-foreground font-mono">{result.phonepeOrderId}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">Order Status:</span>{' '}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.orderStatus === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.orderStatus}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">Job Status:</span>{' '}
                          <span className="text-muted-foreground">{result.jobStatus}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Job Created:</span>{' '}
                          <span className="text-muted-foreground">
                            {new Date(result.jobCreatedAt).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">Is Paid:</span>{' '}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.isPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.isPaid ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {/* Images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Image */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Original Image</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(result.originalUrl, `original-${result.orderId}.jpg`)}
                              disabled={downloading === result.originalUrl}
                            >
                              {downloading === result.originalUrl ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                            {result.originalUrl ? (
                              <img
                                src={result.originalUrl}
                                alt="Original"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image not available</text></svg>';
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <ImageIcon className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Colored Image */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Colored Image</h4>
                            {result.coloredImageUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(result.coloredImageUrl!, `colored-${result.orderId}.jpg`)}
                                disabled={downloading === result.coloredImageUrl}
                              >
                                {downloading === result.coloredImageUrl ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                            {result.coloredImageUrl ? (
                              <img
                                src={result.coloredImageUrl}
                                alt="Colored"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image not available</text></svg>';
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-xs">No colored image</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
