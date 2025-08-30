import { BillingPage } from '@flowglad/nextjs'

export default function Billing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your subscription and payment methods</p>
        </div>
        <BillingPage />
      </div>
    </div>
  )
}
