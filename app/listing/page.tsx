"use client";

import { Suspense } from "react";

function ListingContent() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Listing Page Test</h1>
        <p className="text-gray-600">Minimal version to test React error #310</p>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>}>
      <ListingContent />
    </Suspense>
  );
}
