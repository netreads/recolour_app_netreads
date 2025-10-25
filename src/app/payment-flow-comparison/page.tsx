'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';

export default function PaymentFlowComparison() {
  const [selectedFlow, setSelectedFlow] = useState<'current' | 'simple'>('simple');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Flow Comparison
            </h1>
            <p className="text-xl text-gray-600">
              Current vs Simplified Payment Verification
            </p>
          </div>

          {/* Flow Selection */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-lg border">
              <Button
                variant={selectedFlow === 'current' ? 'default' : 'ghost'}
                onClick={() => setSelectedFlow('current')}
                className="px-6"
              >
                Current Flow
              </Button>
              <Button
                variant={selectedFlow === 'simple' ? 'default' : 'ghost'}
                onClick={() => setSelectedFlow('simple')}
                className="px-6"
              >
                Simple Flow (POC)
              </Button>
            </div>
          </div>

          {/* Flow Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Current Flow */}
            <Card className={`${selectedFlow === 'current' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Current Flow
                  {selectedFlow === 'current' && <Badge variant="secondary">Selected</Badge>}
                </CardTitle>
                <CardDescription>
                  Polling-based verification with multiple retries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                    <div>
                      <p className="font-medium">Create Order</p>
                      <p className="text-sm text-gray-600">Generate PhonePe order and redirect URL</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                    <div>
                      <p className="font-medium">User Payment</p>
                      <p className="text-sm text-gray-600">User completes payment on PhonePe</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                    <div>
                      <p className="font-medium">Redirect to Success Page</p>
                      <p className="text-sm text-gray-600">User redirected to /payment/success</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">4</div>
                    <div>
                      <p className="font-medium">Polling Verification</p>
                      <p className="text-sm text-gray-600">10 attempts over ~30 seconds with exponential backoff</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">5</div>
                    <div>
                      <p className="font-medium">Success/Failure</p>
                      <p className="text-sm text-gray-600">Show result and allow download</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Issues:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Complex polling logic with exponential backoff</li>
                    <li>• Multiple API calls (up to 10 per user)</li>
                    <li>• 30+ second verification time</li>
                    <li>• Race conditions possible</li>
                    <li>• Complex retry logic</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Simple Flow */}
            <Card className={`${selectedFlow === 'simple' ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Simple Flow (POC)
                  {selectedFlow === 'simple' && <Badge variant="secondary">Selected</Badge>}
                </CardTitle>
                <CardDescription>
                  Single verification check with 10-second timeout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">1</div>
                    <div>
                      <p className="font-medium">Create Order</p>
                      <p className="text-sm text-gray-600">Generate PhonePe order and redirect URL</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">2</div>
                    <div>
                      <p className="font-medium">User Payment</p>
                      <p className="text-sm text-gray-600">User completes payment on PhonePe</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">3</div>
                    <div>
                      <p className="font-medium">Redirect to Simple Success</p>
                      <p className="text-sm text-gray-600">User redirected to /payment/simple-success</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">4</div>
                    <div>
                      <p className="font-medium">Single Verification</p>
                      <p className="text-sm text-gray-600">One PhonePe API call with 10-second timeout</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">5</div>
                    <div>
                      <p className="font-medium">Success/Failure/Retry</p>
                      <p className="text-sm text-gray-600">Clear result with optional retry (max 3 attempts)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Single API call per verification</li>
                    <li>• 10-second timeout prevents hanging</li>
                    <li>• Clear success/failure states</li>
                    <li>• Simple retry logic (max 3 attempts)</li>
                    <li>• No complex polling or backoff</li>
                    <li>• Faster user experience</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Endpoints */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">API Endpoints</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current API</CardTitle>
                  <CardDescription>/api/payments/status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    GET /api/payments/status?order_id=order_123
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Polls PhonePe status with complex retry logic
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Simple API (POC)</CardTitle>
                  <CardDescription>/api/payments/simple-status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    GET /api/payments/simple-status?order_id=order_123
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Single PhonePe check with 10-second timeout
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Test Links */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-6">Test the Flows</h2>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <a href="/payment/success?order_id=test_order_123&job_id=test_job_456">
                  Test Current Flow
                </a>
              </Button>
              <Button asChild>
                <a href="/payment/simple-success?order_id=test_order_123&job_id=test_job_456">
                  Test Simple Flow (POC)
                </a>
              </Button>
            </div>
          </div>

          {/* Implementation Notes */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Implementation Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Simple Flow Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>10-second timeout:</strong> Prevents hanging on slow PhonePe responses</li>
                    <li>• <strong>Single verification:</strong> One API call instead of polling</li>
                    <li>• <strong>Clear states:</strong> SUCCESS, FAILED, PENDING, TIMEOUT</li>
                    <li>• <strong>Smart retry:</strong> Max 3 attempts with countdown timer</li>
                    <li>• <strong>Robust error handling:</strong> Graceful fallbacks for all scenarios</li>
                    <li>• <strong>No webhooks needed:</strong> Direct PhonePe SDK status checking</li>
                    <li>• <strong>No reconciliation:</strong> Trust PhonePe SDK response</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Files Created:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code>/api/payments/simple-status/route.ts</code> - New API endpoint</li>
                    <li>• <code>/payment/simple-success/page.tsx</code> - New success page</li>
                    <li>• <code>/payment-flow-comparison/page.tsx</code> - This comparison page</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
