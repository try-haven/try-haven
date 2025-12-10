"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { textStyles } from "@/lib/styles";
import { ApartmentListing } from "@/lib/data";
import { useListings } from "@/contexts/ListingsContext";

interface MetricEvent {
  listingId: string;
  timestamp: number;
  type: 'view' | 'swipeRight' | 'swipeLeft' | 'share' | 'unlike' | 'review';
  userId?: string;
  rating?: number; // For review events
}

interface ListingChange {
  listingId: string;
  timestamp: number;
  field: string;
  oldValue: any;
  newValue: any;
}

interface ListingTrendsChartProps {
  listingId: string;
}

export default function ListingTrendsChart({ listingId }: ListingTrendsChartProps) {
  const { listings: allListings, isLoading } = useListings();

  const chartData = useMemo(() => {
    if (allListings.length === 0) {
      return { data: [], priceChanges: [], currentPrice: 0 };
    }

    // Load the listing to get initial price
    const listing = allListings.find(l => l.id === listingId) || null;

    if (!listing) {
      return { data: [], priceChanges: [], currentPrice: 0 };
    }

    const currentPrice = listing.price;

    // Load events
    const eventsData = localStorage.getItem("haven_listing_metric_events");
    const allEvents: MetricEvent[] = eventsData ? JSON.parse(eventsData) : [];

    // Filter events for this listing
    let listingEvents = allEvents.filter(e => e.listingId === listingId);

    // For likes/passes, only count the most recent action per user
    // This ensures each user can only be counted as either a like OR a pass, not both
    const userActions = new Map<string, MetricEvent>();

    listingEvents.forEach(event => {
      // Only filter user-specific engagement actions (swipes and unlikes)
      if ((event.type === 'swipeRight' || event.type === 'swipeLeft' || event.type === 'unlike') && event.userId) {
        const existing = userActions.get(event.userId);
        // Keep the most recent action for this user
        if (!existing || event.timestamp > existing.timestamp) {
          userActions.set(event.userId, event);
        }
      }
    });

    // Filter out old user actions and keep only the most recent one per user
    // Also keep all shares and views (they're not unique per user)
    listingEvents = listingEvents.filter(event => {
      if (event.type === 'share' || event.type === 'view') {
        return true; // Keep all shares and views
      }
      if (event.userId && (event.type === 'swipeRight' || event.type === 'swipeLeft' || event.type === 'unlike')) {
        // Only keep if this is the most recent action for this user
        const mostRecent = userActions.get(event.userId);
        return mostRecent && mostRecent.timestamp === event.timestamp;
      }
      return true; // Keep events without userId for backwards compatibility
    });

    if (listingEvents.length === 0) {
      return { data: [], priceChanges: [], currentPrice };
    }

    // Get earliest and latest timestamps
    const timestamps = listingEvents.map(e => e.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    // If all events are from the same time, create a small range
    const timeRange = maxTime === minTime ? 60 * 60 * 1000 : maxTime - minTime;

    // Create time buckets with adaptive granularity
    // - Less than 1 hour: use 1-minute buckets
    // - Less than 2 days: use 1-hour buckets
    // - Otherwise: use daily buckets
    let bucketSize: number;
    let timeFormat: 'minute' | 'hour' | 'day';

    if (timeRange < 60 * 60 * 1000) {
      // Less than 1 hour - use minute buckets
      bucketSize = 60 * 1000;
      timeFormat = 'minute';
    } else if (timeRange < 2 * 24 * 60 * 60 * 1000) {
      // Less than 2 days - use hour buckets
      bucketSize = 60 * 60 * 1000;
      timeFormat = 'hour';
    } else {
      // 2+ days - use day buckets
      bucketSize = 24 * 60 * 60 * 1000;
      timeFormat = 'day';
    }

    const numBuckets = Math.max(Math.ceil(timeRange / bucketSize), 1);

    // Initialize buckets
    const buckets: Record<number, { likes: number; passes: number; shares: number; views: number; unlikes: number; reviews: Array<{ userId: string; rating: number }> }> = {};

    for (let i = 0; i <= numBuckets; i++) {
      const bucketTime = minTime + i * bucketSize;
      buckets[bucketTime] = { likes: 0, passes: 0, shares: 0, views: 0, unlikes: 0, reviews: [] };
    }

    // Fill buckets with cumulative counts
    listingEvents.forEach(event => {
      const bucketTime = Math.floor((event.timestamp - minTime) / bucketSize) * bucketSize + minTime;
      if (buckets[bucketTime]) {
        if (event.type === 'swipeRight') buckets[bucketTime].likes += 1;
        else if (event.type === 'swipeLeft') buckets[bucketTime].passes += 1;
        else if (event.type === 'share') buckets[bucketTime].shares += 1;
        else if (event.type === 'view') buckets[bucketTime].views += 1;
        else if (event.type === 'unlike') buckets[bucketTime].unlikes += 1;
        else if (event.type === 'review' && event.userId && event.rating) {
          buckets[bucketTime].reviews.push({ userId: event.userId, rating: event.rating });
        }
      }
    });

    // Convert to cumulative data points
    let cumulativeLikes = 0;
    let cumulativePasses = 0;
    let cumulativeShares = 0;
    const allRatings = new Map<string, number>(); // userId -> rating

    const data = Object.entries(buckets)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([timestamp, counts]) => {
        cumulativeLikes += counts.likes - counts.unlikes;
        cumulativePasses += counts.passes;
        cumulativeShares += counts.shares;

        // Update ratings map with new reviews (keep most recent rating per user)
        counts.reviews.forEach(review => {
          allRatings.set(review.userId, review.rating);
        });

        // Calculate average rating from all ratings so far
        const ratingsArray = Array.from(allRatings.values());
        const avgRating = ratingsArray.length > 0
          ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length
          : null;

        const date = new Date(parseInt(timestamp));
        let label: string;

        if (timeFormat === 'minute') {
          label = date.toLocaleTimeString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
        } else if (timeFormat === 'hour') {
          label = date.toLocaleTimeString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric'
          });
        } else {
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }

        return {
          time: label,
          timestamp: parseInt(timestamp),
          Likes: Math.max(0, cumulativeLikes),
          Passes: cumulativePasses,
          Shares: cumulativeShares,
          'Avg Rating': avgRating !== null ? Number(avgRating.toFixed(2)) : null,
        };
      });

    // Load price changes
    const changesData = localStorage.getItem("haven_listing_changes");
    const allChanges: ListingChange[] = changesData ? JSON.parse(changesData) : [];
    const priceChanges = allChanges
      .filter(c => c.listingId === listingId && c.field === 'price')
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(c => ({
        timestamp: c.timestamp,
        oldValue: c.oldValue,
        newValue: c.newValue,
      }));

    // Build price history - start with the oldest price we know
    let initialPrice = currentPrice;
    if (priceChanges.length > 0) {
      initialPrice = priceChanges[0].oldValue;
    }

    // Add price to each data point
    const dataWithPrice = data.map(point => {
      // Find the latest price change before or at this timestamp
      let priceAtTime = initialPrice;
      for (const change of priceChanges) {
        if (change.timestamp <= point.timestamp) {
          priceAtTime = change.newValue;
        } else {
          break;
        }
      }
      return {
        ...point,
        Price: priceAtTime,
      };
    });

    return { data: dataWithPrice, priceChanges, currentPrice };
  }, [listingId, allListings]);

  const { data, priceChanges, currentPrice } = chartData;

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
        <p className={textStyles.body}>Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
        <p className={textStyles.body}>No activity data yet</p>
        <p className={textStyles.bodySmall}>
          Metrics will appear here as users interact with your listing
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className={`${textStyles.headingSmall} mb-4`}>Engagement, Price & Rating Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 100, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
            label={{ value: 'Price ($)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
          />
          <YAxis
            yAxisId="rating"
            orientation="right"
            domain={[0, 5]}
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fontSize: 12 }}
            label={{ value: 'Rating (★)', angle: 90, position: 'outside', dx: 40, style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #ccc)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: 'var(--tooltip-label, #000)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Likes"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Passes"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Shares"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="stepAfter"
            dataKey="Price"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ r: 4, fill: '#9333ea' }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="rating"
            type="monotone"
            dataKey="Avg Rating"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4, fill: '#f59e0b' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          {priceChanges.map((change, index) => {
            // Find the data point closest to this change
            const dataPoint = data.find(d => d.timestamp >= change.timestamp);
            if (dataPoint) {
              return (
                <ReferenceLine
                  key={index}
                  x={dataPoint.time}
                  stroke="#9333ea"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: `Rent: $${change.oldValue} → $${change.newValue}`,
                    position: 'top',
                    fill: '#9333ea',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                />
              );
            }
            return null;
          })}
        </LineChart>
      </ResponsiveContainer>

      {priceChanges.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
            Price Changes
          </p>
          <div className="space-y-1">
            {priceChanges.map((change, index) => (
              <p key={index} className="text-xs text-purple-800 dark:text-purple-300">
                {new Date(change.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}: ${change.oldValue} → ${change.newValue}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
