# Haven — Apartment Swiping App

A modern apartment discovery platform with a Tinder-like swipe interface. Find your perfect apartment by swiping through personalized listings tailored to your preferences and discover your next home.

🏡https://try-haven.github.io/haven/

## 🔑 Test Login Credentials

### Test User (Searcher)
- **Username**: `test`
- **Email**: `test@gmail.com`
- **Password**: `test1234`

### Test Manager (Property Manager)
- **Username**: `demo-manager`
- **Email**: `demo-manager@haven.app`
- **Password**: `demo123456`

## 🚀 Project Overview

Haven is a web-based apartment search application that makes finding your next home as simple as swiping right. Built with Next.js, React, and Tailwind CSS, featuring smooth animations, dark mode support, and an intuitive user experience.

## ✨ Features Implemented

### Week 1 Deliverables ✅

- **Marketing Landing Page**
  - Hero section with call-to-action
  - Feature cards showcasing app capabilities
  - About section
  - Responsive navigation with logo
  - Dark mode toggle

- **Onboarding Flow**
  - Sign Up / Log In landing page
  - User type selection (Searcher vs Manager)
  - Address input with autocomplete and interactive map
  - Commute preference selection (Car, Public Transit, Walk, Bike)
  - Smooth transitions between screens

- **Swipeable Card Stack**
  - Tinder-like swipe interface for apartment listings
  - Drag to swipe or use arrow keys
  - Like/Pass buttons with hover effects
  - Swipe animations with visual feedback (LIKE/NOPE overlays)
  - Image carousel for multiple listing photos
  - Progress indicator showing current position
  - Share listing functionality
  - Unique user tracking (one action per user per listing)

- **Liked Listings**
  - View all apartments you've swiped right on
  - Grid view and detailed view
  - Remove listings from liked collection (tracks as "unlike" event)
  - Image carousel support
  - Write and edit reviews with ratings

- **Listing Detail Pages**
  - Full listing information with image gallery
  - Interactive map showing location
  - User reviews and ratings
  - Share listing via native share or copy link
  - Responsive design with dark mode support

- **Dark Mode**
  - System-wide dark mode support
  - Persistent user preference (localStorage)
  - Toggle button in navigation and manager portal
  - Smooth theme transitions

- **Address Input with Geo-UX**
  - Real-time address autocomplete (OpenStreetMap/Nominatim)
  - Interactive map view (Leaflet)
  - Current location detection
  - Simplified address formatting
  - Visual map updates on selection

### Manager Portal ✅

- **Manager Authentication**
  - Separate account type for property managers
  - Dedicated dashboard with analytics
  - Static logo (no animation) for professional look
  - Dark mode toggle

- **Listing Management**
  - Create new listings with:
    - Title, address, price, bedrooms, bathrooms, sqft
    - Multiple image URLs
    - Amenities (comma-separated)
    - Availability date
    - Description
  - Edit existing listings with change tracking
  - Delete listings with confirmation
  - Preview listings before publishing
  - Share listing links

- **Analytics Dashboard**
  - Total listings count
  - Total views, likes, and passes
  - Per-listing metrics:
    - Views
    - Likes (swipe rights)
    - Passes (swipe lefts)
    - Like rate percentage
    - Shares count
    - Reviews count
  - Real-time metrics tracking

- **Trends Charts** 🆕
  - Interactive line charts with three Y-axes:
    - **Left axis**: Engagement count (Likes, Passes, Shares)
    - **Middle axis**: Price ($/month)
    - **Right axis**: Average rating (1-5 stars)
  - Adaptive time granularity:
    - Minute-by-minute (< 1 hour of data)
    - Hourly (1 hour to 2 days)
    - Daily (2+ days)
  - Price change markers with annotations
  - Rating trend line showing average over time
  - Unique user tracking (each user counted once)
  - Auto-expanded charts for immediate visibility

- **Review & Rating Tracking**
  - Track when reviews are submitted or updated
  - Monitor rating changes over time
  - Calculate rolling average rating
  - Correlate ratings with price changes
  - See how user satisfaction changes

- **Change History**
  - Track all listing edits with timestamps
  - Record price changes specifically
  - Display change markers on trends chart
  - Cross-reference changes with engagement metrics

### Personalization Engine 🎯

Haven features a sophisticated, multi-stage recommendation system that combines explicit user preferences with behavioral learning to deliver highly personalized apartment suggestions. The system is designed to be intelligent, performant, and privacy-preserving.

#### What's Learned from Your Swipes (Currently Active)
- ✅ **Amenity preferences** - Pool, gym, parking, pet-friendly, etc. (weighted by like vs. dislike ratio)
- ✅ **Quality preferences** - Preferred number of photos and description length
- ✅ **Location scoring** - Distance-based scoring from your preferred address

#### What's NOT Learned (Must Be Explicitly Set)
- ⚠️ **Price range** - Must be set in preferences (not inferred from swipes)
- ⚠️ **Bedrooms/Bathrooms** - Must be set in preferences (not inferred from swipes)
- ⚠️ **Square footage** - Not used for filtering or scoring

**Future Enhancements:**

1. **Learned Price/Bedroom/Bathroom Fallbacks:** If we want the system to learn price, bedroom, and bathroom preferences from swipe behavior and use them as fallbacks when users haven't set explicit values, this would need to be implemented. Currently, these are treated as hard requirements that users must specify upfront.

2. **Hybrid Amenity Preferences (Upfront + Learning):** Currently, amenity preferences are only learned from swipe behavior (requires 5+ swipes). A hybrid approach could allow users to select initial amenity preferences during onboarding (checkboxes for Pool, Gym, Parking, Pet-friendly, etc.), then continue refining these preferences based on actual swipe behavior. This would give new users immediate personalization while still benefiting from behavioral learning over time.

---

## Architecture Overview

The personalization engine uses a **two-stage architecture** that separates hard constraints from soft preferences:

```
User Input → Hard Filters → Filtered Listings → Soft Scoring → Ranked Results
   ↓              ↓                                    ↓
Explicit      Must-Match                         Learned
Preferences   Requirements                       Preferences
```

This architecture is intentionally designed to:
1. **Avoid redundant scoring**: Don't score attributes we've already filtered by
2. **Maximize performance**: Filter early to reduce scoring computation by 10-300x
3. **Separate concerns**: Hard requirements vs. stylistic preferences
4. **Enable learning**: Focus scoring on subjective factors that require behavior analysis

---

## Stage 1: Hard Filters (Must-Match Requirements)

Hard filters eliminate listings that don't meet fundamental requirements. These are applied **before** scoring to maximize performance.

### Filter Details

| Filter | Tolerance | Example | Technical Notes |
|--------|-----------|---------|-----------------|
| **Location (State)** | Exact state match | User in "San Francisco, CA" → Only shows CA listings | Uses state extraction with comprehensive 50-state mapping. Handles abbreviations (CA, Calif, California). **Prevents cross-country false matches** (e.g., "Cambridge" won't match "CA"). |
| **Price Range** | ±40% buffer | User wants $2000 → Shows $1200-$2800 | Generous buffer to avoid over-filtering. If user sets min=$1500, max=$2500 → shows $900-$3500. **Must be explicitly set by user** (not learned from behavior). |
| **Bedrooms** | Range-based | User wants 1-3br → Shows 1-3br only | Exact range matching. **Must be explicitly set by user** (not learned from behavior). |
| **Bathrooms** | Range-based | User wants 1.5-2.5ba → Shows 1.5-2.5ba only | Handles half-bathrooms (1.5, 2.5, etc.). **Must be explicitly set by user** (not learned from behavior). |
| **Minimum Rating** | Exact threshold | User sets 3.5★ min → Only 3.5★+ listings | Filters out poorly-rated properties. **New listings with no reviews pass through** (benefit of the doubt). |

### Why These Specific Tolerances?

- **State-level location**: Too strict to filter by city (might miss great nearby apartments). Too loose to show out-of-state (not viable for most users).
- **±40% price**: Captures "stretch budget" and "pleasant surprises" without overwhelming with unaffordable options.
- **±1 bedroom**: Balances flexibility (might consider 1br if great deal) with relevance (4br for 2br preference is too far).
- **±0.5 bathroom**: Minimal tolerance since bathroom count is more rigid than bedrooms.

### Performance Impact

Hard filters reduce the dataset by **80-95%** before scoring:
- Example: 10,000 listings → 500 after filters → Only 500 scored
- **10-300x faster** than scoring all listings
- Capped at 500 listings max to guarantee fast scoring
- O(n) filtering followed by O(n log n) sorting

---

## Stage 2: Soft Scoring (Ranking Within Matches)

After filtering, listings are scored 0-100% based on **learned preferences**. This focuses on subjective factors that vary by user.

### Scoring Weights

| Factor | Weight | Rationale | Score Calculation |
|--------|--------|-----------|-------------------|
| **Location/Distance** | **40%** | **PRIMARY FACTOR** - Geographic proximity to user's preferred address is most important | Haversine distance calculation: 0-5mi = 100%, 5-15mi = 80%, 15-30mi = 50%, 30-50mi = 20%, 50+mi = 0% |
| **Amenities** | **35%** | **SECONDARY DIFFERENTIATOR** - Learned from swipe behavior using contrast analysis | Weighted sum of amenity preference scores comparing liked vs disliked listings |
| **Quality** | **15%** | Reflects listing completeness and professionalism | 50% photo count (5+ = perfect), 50% description length (200+ chars = perfect) |
| **Rating** | **10%** | Social proof and tenant satisfaction | Linear scale: 5★ = 100%, 0★ = 0%. New listings default to 50% (neutral). |

### Why These Weights?

1. **Location/Distance (40%)**: Geographic proximity is the most important factor - an apartment 300 miles away is essentially unusable regardless of how perfect the amenities are. Distance scoring is very punishing: listings 50+ miles away get 0% location score, essentially filtering them out. This ensures nearby apartments always rank higher than far ones.

2. **Amenities (35%)**: After location, amenities are the main lifestyle differentiator. Pool vs. no pool, gym vs. no gym, parking vs. street parking - these define whether an apartment fits your lifestyle. Learned from swipe behavior using contrast analysis.

3. **Quality (15%)**: High-quality listings with many photos and detailed descriptions indicate serious landlords and help users make informed decisions. Important but secondary to location and amenities.

4. **Rating (10%)**: Important for avoiding bad landlords, but most listings don't have many reviews. Lower weight prevents over-penalizing new listings.

### Example Score Calculation

```
User preference: Palo Alto, CA
Listing A: 1br, $2000, Mountain View, CA (15 miles from Palo Alto)
- Distance: 15 miles → 80% location score
- Amenities: Pool (high pref), Gym (high pref), Parking (medium pref) → 85% amenity score
- Quality: 6 photos, 250-char description → 90% quality score
- Rating: 4.2★ (8 reviews) → 84% rating score

Final Score = (0.40 × 80%) + (0.35 × 85%) + (0.15 × 90%) + (0.10 × 84%)
            = 32% + 29.75% + 13.5% + 8.4%
            = 83.65% → "Top Pick" badge (80%+ threshold)

Listing B: Same amenities/quality but in Santa Monica, CA (300+ miles away)
- Distance: 300 miles → 0% location score (50+ miles = filtered out)
- Final Score = (0.40 × 0%) + ... = ~35% → Won't be shown/ranked very low
```

---

## Behavioral Learning: How Preferences Are Learned

The system learns from your swipe behavior using **contrast learning** - comparing what you like vs. what you pass on.

### Learning Algorithm

For each user, the system tracks:
- **Liked listings**: All apartments swiped right
- **Disliked listings**: All apartments swiped left
- **Swipe history**: Stored in database, synced across devices

The system recalculates learned preferences **every 5 swipes** (immediate in-session learning):

#### 1. **Amenity Preferences** (Contrast Learning)

```python
# Pseudocode for amenity learning
for amenity in all_amenities:
    liked_count = count(amenity in liked_listings)
    disliked_count = count(amenity in disliked_listings)

    like_rate = liked_count / (liked_count + disliked_count)
    preference_weight = like_rate × liked_count

    # Higher weight = stronger preference
    # like_rate close to 1.0 = almost always like when present
    # like_rate close to 0.5 = neutral (appears in both)
    # like_rate close to 0.0 = actively avoid
```

**Example:**
- User has liked 20 listings, passed on 30 listings
- **Pool**: Appears in 15 liked, 5 disliked → like_rate = 15/20 = 0.75 → weight = 0.75 × 15 = 11.25
- **Gym**: Appears in 10 liked, 10 disliked → like_rate = 10/20 = 0.50 → weight = 0.50 × 10 = 5.0
- **Parking**: Appears in 18 liked, 3 disliked → like_rate = 18/21 = 0.86 → weight = 0.86 × 18 = 15.48

**Result**: User strongly prefers parking (15.48) > pool (11.25) > gym (5.0, neutral)

#### 2. **Quality Preferences**

```python
# Learn preferred image count and description length
liked_image_counts = [len(listing.images) for listing in liked_listings]
liked_desc_lengths = [len(listing.description) for listing in liked_listings]

avg_image_count = median(liked_image_counts)  # Use median for robustness
avg_desc_length = median(liked_desc_lengths)
```

**Example:**
- User consistently likes listings with 5+ photos and 200+ char descriptions
- Future listings are scored higher if they match this quality level
- Prevents showing low-effort listings to quality-conscious users

#### 3. **Basic Preferences (Price, Bedrooms, Bathrooms, Sqft)** - ⚠️ NOT CURRENTLY IMPLEMENTED

**Current State:**
- These filters **must be explicitly set by the user** in preferences
- The system does **NOT** learn these values from swipe behavior
- No fallback to learned values if user hasn't set them

**Future Enhancement:**
If we want to implement learning for these in the future, the algorithm would be:

```python
# Proposed implementation (NOT ACTIVE)
liked_prices = [listing.price for listing in liked_listings]
liked_bedrooms = [listing.bedrooms for listing in liked_listings]
# ... same for bathrooms, sqft

learned_price_median = median(liked_prices)
learned_price_range = (median × 0.8, median × 1.2)  # ±20% around median

# Use as fallback if user didn't set explicit preferences
if not user.preferences.priceMin:
    user.preferences.priceMin = learned_price_range[0]
if not user.preferences.priceMax:
    user.preferences.priceMax = learned_price_range[1]
```

**Why not implemented?**
- Price, bedrooms, bathrooms, and sqft are typically **explicit user requirements**, not learned preferences
- Users generally know these constraints upfront ("I need 2 bedrooms" or "My budget is $2000")
- Learning these could override important user requirements with inferred values

---

## Database Storage & Cross-Device Sync

All learned preferences are stored in the **user profile** (Supabase Postgres), not localStorage.

### Schema

```sql
-- profiles table (user account)
ALTER TABLE profiles ADD COLUMN
  -- Explicit preferences (user-set)
  address TEXT,
  latitude NUMERIC,              -- Geocoded latitude of user's preferred address
  longitude NUMERIC,             -- Geocoded longitude of user's preferred address
  commute_options TEXT[],        -- ["car", "public_transit", "walk", "bike"]
  price_min INTEGER,
  price_max INTEGER,
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  bathrooms_min NUMERIC,
  bathrooms_max NUMERIC,
  min_rating NUMERIC,
  weight_distance INTEGER,       -- Default 40 (40% of total score)
  weight_amenities INTEGER,      -- Default 35 (35% of total score)
  weight_quality INTEGER,        -- Default 15 (15% of total score)
  weight_rating INTEGER,         -- Default 10 (10% of total score)

  -- Learned preferences (auto-calculated from swipe behavior)
  -- Note: Sqft preferences were removed as they were not being used
  learned_preferred_amenities JSONB,  -- {"pool": 15.48, "gym": 5.0, ...}
  learned_avg_image_count NUMERIC,    -- Average image count in liked listings
  learned_avg_description_length INTEGER,  -- Average description length in liked listings
  learned_preferences_updated_at TIMESTAMP;

  -- Removed columns (not implemented, dead code):
  -- learned_price_min, learned_price_max
  -- learned_bedrooms_min, learned_bedrooms_max
  -- learned_bathrooms_min, learned_bathrooms_max
  -- learned_sqft_min, learned_sqft_max
  -- These would need to be implemented if we want fallback learning in the future

-- listings table
ALTER TABLE listings ADD COLUMN
  latitude NUMERIC,              -- Geocoded latitude of listing address
  longitude NUMERIC;             -- Geocoded longitude of listing address
```

### Update Strategy

**Smart Learning Strategy (Option B: "Wow Moment" + Performance):**

1. **First-Time Personalization** (New Users Only - The "Wow" Moment)
   - **Trigger**: Exactly at 5th swipe (one-time event)
   - **Process**: Calculate learned preferences, re-rank remaining listings
   - **Effect**: User sees instant personalization - apartments matching their style jump to top
   - **Performance**: Single recalculation, O(n) + O(500 log 500) ≈ 15ms
   - **UX**: Creates anticipation with learning banner, delivers "wow" with success message

2. **Session Continuation** (After Personalization)
   - **No more recalculation** during session (performance optimization)
   - User continues swiping through personalized, pre-ranked list
   - **Performance**: Zero overhead - just swiping through sorted array

3. **Database Persistence** (Cross-Session Personalization)
   - **Trigger**: When user leaves page (unmount)
   - **Process**: Calculate final learned preferences from all swipes, save to database
   - **Effect**: Preferences preserved across devices and sessions
   - **Performance**: Async on unmount, doesn't block UI
   - **UX**: Seamless continuation when returning or switching devices

**Example Timeline:**
```
NEW USER - First Session:
0:00 - User starts swiping (no personalization yet, quality-ranked)
0:01 - Swipe 1 → Learning banner appears: "4 more to go!"
0:02 - Swipe 3 → Banner updates: "2 more to go!"
0:03 - Swipe 5 → 🎯 WOW MOMENT!
       ├─ Calculate preferences (15ms)
       ├─ Re-rank listings (instant)
       ├─ Show success message: "✨ Personalization Activated!"
       └─ User sees apartments with their preferred amenities at top
0:04-0:15 - Continue swiping (no recalculation, smooth experience)
0:15 - User leaves → Save preferences to database
---
RETURNING USER - Next Session:
0:00 - User returns → Loads yesterday's learned preferences
0:01 - Starts swiping personalized list (no recalculation needed)
0:10 - User leaves → Updated preferences save to database
```

This design ensures:
- ✅ **"Wow" factor**: New users see personalization activate in real-time (differentiating feature!)
- ✅ **Performance**: Only 1 recalculation for new users, 0 for returning users
- ✅ **No wasted sessions**: Even 15-minute sessions save progress to database
- ✅ **Scales perfectly**: O(1) re-rankings per session regardless of database size
- ✅ **Cross-device sync**: Database persistence on every session exit

### Privacy & Security

- ✅ **Preferences tied to user account** (not shared publicly)
- ✅ **Swipe history private** (only you can see what you liked/passed)
- ✅ **No tracking across users** (your preferences don't influence others)
- ✅ **Data portability** (export your data anytime via Supabase)
- ✅ **GDPR-compliant** (right to deletion, right to access)

---

## User Experience Flow

### New User (First Session)

1. **Onboarding**: Set address (required for state filter)
2. **Optional preferences**: Can set or skip price/bedrooms/bathrooms
3. **Start swiping**: See quality-ranked listings (by photo count, rating)
4. **Learning banner appears**:
   - Shows progress bar (0/5 → 1/5 → 2/5...)
   - Message: "Swipe on X more apartments and we'll personalize your recommendations!"
   - Creates anticipation and sets expectations
5. **After swipe #5**: 🎯 **THE WOW MOMENT**
   - Success message: "✨ Personalization Activated!"
   - Listings instantly re-rank based on learned preferences
   - User sees apartments matching their style jump to the top
   - **This is Haven's differentiating "wow" factor**
6. **Rest of session**: Continue swiping pre-ranked list (no more recalculation)
7. **When leaving**: Preferences automatically save to database
8. **Next session**: Start with yesterday's learned preferences, continue improving

### Returning User

1. **Login**: Learned preferences loaded from database (from last session)
2. **Swipe page**: Listings filtered and ranked using stored preferences
3. **Every 5 swipes**: In-session preferences update → rankings improve
4. **Every hour OR on exit**: Updated preferences save to database
5. **Cross-device**: Same personalization on phone, tablet, desktop

### Edge Cases Handled

| Scenario | How System Handles It |
|----------|----------------------|
| **User likes everything** | Neutral scores, no strong preferences learned. Fall back to quality ranking. |
| **User passes on everything** | Same as above - no differentiation means no learning. |
| **Conflicting signals** (likes both cheap and expensive) | Median-based learning captures middle ground. Wide learned range. |
| **Single amenity dominates** (50% of listings have "parking") | Contrast learning prevents over-weighting common amenities. |
| **New listing (no reviews)** | Gets neutral 50% rating score, not penalized. |
| **Stale preferences** (haven't swiped in months) | Still uses last learned preferences. Cache doesn't expire (only updates if new swipes). |
| **Device switch mid-session** | Swipe history in localStorage syncs on next page load. Small delay (< 1 hour) for learned preferences to update. |

---

## Performance Optimizations

1. **Hard filters first** (O(n)) → Reduces dataset by 80-95%
2. **Cap at 500 listings** → Guarantees scoring is fast even with large datasets
3. **Cache learned preferences** → Only recalculate when stale (>1 hour) + new data (5+ swipes)
4. **Database indexing** → GIN index on JSONB amenities for fast queries
5. **Memoized ranking** → useMemo hook prevents re-ranking on every render
6. **Async preference updates** → Don't block UI while learning

**Benchmark** (simulated with 10,000 listings):
- Without hard filters: ~500ms to score all listings
- With hard filters: ~15ms (500 listings scored)
- **33x faster** 🚀

---

## Technical Implementation

### Key Files

| File | Purpose |
|------|---------|
| `lib/recommendations.ts` | Core learning and scoring algorithms |
| `lib/geocoding.ts` | Geocoding utilities and distance calculation |
| `lib/listings.ts` | Listing CRUD operations with geocoding |
| `app/swipe/page.tsx` | Swipe interface with personalization logic |
| `contexts/UserContext.tsx` | User profile, learned preferences, geocoded address storage |
| `contexts/LikedListingsContext.tsx` | Liked listings management with localStorage sync |
| `components/SwipeableCard.tsx` | Match score display, Top Pick badges |
| `scripts/seed-listings.ts` | Database seeding with geocoding |
| `scripts/check-geocoding.ts` | Geocoding status verification |
| `scripts/clear-listings.ts` | Database cleanup utility |
| `scripts/reset-user-preferences.ts` | User reset for testing |

### Key Functions

```typescript
// Geocoding & Distance (lib/geocoding.ts)
async function geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null>
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number  // Returns miles
function scoreByDistance(distanceInMiles: number): number  // 0-1 score

// Learning & Scoring (lib/recommendations.ts)
function learnFromSwipeHistory(
  swipeHistory: SwipeHistory[],
  allListings: ApartmentListing[]
): LearnedPreferences

function calculateMatchScore(
  listing: ApartmentListing,
  userPreferences: UserPreferences,
  learnedPreferences: LearnedPreferences
): number  // 0-100

function rankListings(
  listings: ApartmentListing[],
  userPreferences: UserPreferences,
  swipeHistory: SwipeHistory[]
): ListingWithScore[]

function shouldUpdateLearnedPreferences(
  userPreferences: UserPreferences,
  minSwipes: number = 5
): boolean

function getSwipeHistory(): SwipeHistory[]  // Reads from localStorage

// User Profile (contexts/UserContext.tsx)
async function updateLearnedPreferences(learned: LearnedPreferences): Promise<void>
async function updatePreferences(preferences: UserPreferences): Promise<void>  // Geocodes address
```

---

## Real-World Example Walkthrough

**Alice** is looking for an apartment in San Francisco:

### Day 1 - Onboarding
- Sets address: "San Francisco, California"
- Skips price/bedrooms (wants to explore first)
- **System applies**: State filter (CA only), quality ranking

### Day 1 - First 5 Swipes (Minutes 0-2)
- ❤️ Likes: 2 with parking, 1 with pool
- 👎 Passes: 1 with gym, 1 with laundry
- **After 5 swipes**: 🎯 **Learning kicks in immediately!**
  - Parking: 2 liked, 0 passed → like_rate = 100% → strong signal
  - Pool: 1 liked, 0 passed → like_rate = 100% → positive signal
  - Gym: 0 liked, 1 passed → like_rate = 0% → negative signal
- **Listings re-rank**: Apartments with parking jump to top

### Day 1 - Next 5 Swipes (Minutes 2-5)
- ❤️ Likes: 2 more with parking, 1 with pool
- 👎 Passes: 1 with pool, 1 with laundry
- **After 10 total swipes**: Preferences recalculate again
  - Parking: 4 liked, 0 passed → like_rate = 100% → **very strong preference**
  - Pool: 2 liked, 1 passed → like_rate = 67% → moderate preference
  - Gym: 0 liked, 1 passed → avoid
  - Laundry: 0 liked, 2 passed → avoid
- **Rankings refine**: Parking-heavy apartments prioritized even more

### Day 1 - After 15 Minutes
- Total: 15 swipes
- **Preferences auto-save** to database when Alice closes the page
- **Next session**: Rankings will continue from these learned preferences

### Day 3 - Different Device
- Alice logs in on her phone
- **Preferences load** from database
- Sees same personalized ranking as laptop
- Likes 5 more apartments with parking
- **Preference strengthens**: Parking now 85% like_rate

### Week 2 - Explicit Budget
- Alice sets price: $2000-$2500
- **System now applies**: Price filter (±40% = $1200-$3500), parking-weighted scoring
- **Result**: Only affordable apartments, ranked by parking + other preferences

### Result
Alice finds her perfect apartment: 1br, $2,200, parking included, in Mission District (her most-liked neighborhood). **87% match score**, labeled "Top Pick" ⭐

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.3
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Maps**: Leaflet & React Leaflet
- **Charts**: Recharts (for analytics visualization)
- **Language**: TypeScript
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel-ready
- **State Management**: React Context API + localStorage
- **Database**: Supabase (Postgres with PostGIS for geospatial queries)
- **Authentication**: Supabase Auth
- **Geocoding**: OpenStreetMap Nominatim API (free, open-source)
- **Distance Calculation**: Haversine formula implementation
- **AI Services** (Future): HuggingFace Inference API (free tier)

## 🏗️ Architecture & System Design

### Architecture Overview

Haven is designed to run on **$0 infrastructure** using free tiers, making it fully viable and launch-ready:

```
               +------------------------------+
               |         Haven Web            |
               |  Next.js / React             |
               |   (Swipe UI, Upload UI)      |
               +---------------+--------------+
                               |
                               | HTTPS
                               v
       +------------------------------------------------+
       |  Supabase Free Tier                            |
       |------------------------------------------------|
       |  Postgres DB:                                  |
       |    - listings                                  |
       |    - users                                     |
       |    - roommate_profiles                         |
       |    - swipe_events                              |
       |------------------------------------------------|
       |  Auth (email / google)                        |
       |  Storage (photos)                              |
       |  Edge Functions (mock AI validation)          |
       +------------------------------------------------+
                               |
                               v
               +------------------------------+
               |         AI Services          |
               |  HuggingFace Inference API   |
               |  (Free models, 30/day)       |
               +------------------------------+
```

### Why This is $0

**Supabase Free Tier:**
- 500MB Postgres database
- 1GB file storage
- Unlimited authentication
- 50k monthly edge function calls

**Additional Free Services:**
- HuggingFace free inference for lightweight AI
- Vercel free tier for hosting
- GitHub free for CI/CD
- Domain optional (use vercel.app subdomain)

**Annual infrastructure cost: $0** until you scale past ~1,000 users.

### Infrastructure Requirements

**Bare Minimum for MVP:**
- Frontend: React/Next.js (Vercel - free)
- Backend: Supabase or Firebase (free tier)
- Storage: Supabase Storage or Cloudflare R2 (free tier)
- Authentication: Supabase Auth (free)
- No EC2, Kubernetes, or expensive infrastructure needed

**Estimated Cost:**
- Web hosting: $0
- Backend: $0–$25/mo
- Storage: $0–$2/mo
- Domain: $12/yr (optional)
- **Total: $0–$50/mo** for early stage

### Feature Implementation Strategy

1. **Swipe Interface**: React + Framer Motion for smooth drag/swipe physics
2. **User Preferences**: Browser storage first → optional backend sync
3. **Listing Upload**: Photos stored in Supabase Storage (free)
4. **AI Validation**: Lightweight free models or simple heuristics
5. **Roommate Matching**: Client-side cosine similarity or Supabase edge functions
6. **Analytics**: Store swipes in `swipe_events` table for dashboard

## 📁 Project Structure

```
haven/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Main page with routing
│   ├── globals.css                   # Global styles and Tailwind
│   ├── listing/page.tsx              # Listing detail page
│   ├── liked-listings/page.tsx       # Liked listings page
│   ├── search/page.tsx               # Search and browse page
│   ├── swipe/page.tsx                # Swipe interface page
│   └── manager/
│       ├── dashboard/page.tsx        # Manager analytics dashboard
│       ├── add-listing/page.tsx      # Create new listing
│       └── edit-listing/page.tsx     # Edit existing listing
├── components/
│   ├── LandingPage.tsx               # Marketing landing page
│   ├── OnboardingLanding.tsx         # Sign Up/Log In with user type
│   ├── AddressInput.tsx              # Address autocomplete & map
│   ├── CommutePreference.tsx         # Commute options selection
│   ├── CardStack.tsx                 # Swipeable card stack container
│   ├── SwipeableCard.tsx             # Individual apartment card
│   ├── LikedListings.tsx             # Liked listings view
│   ├── ReviewedListings.tsx          # Reviewed listings management
│   ├── ListingTrendsChart.tsx        # Analytics chart component
│   ├── HavenLogo.tsx                 # Reusable logo component
│   ├── DarkModeToggle.tsx            # Dark mode toggle button
│   └── MapView.tsx                   # Interactive map component
├── contexts/
│   ├── UserContext.tsx               # User auth & preferences
│   └── DarkModeContext.tsx           # Dark mode state management
└── lib/
    ├── data.ts                       # Sample apartment listings
    └── styles.ts                     # Reusable style constants
```

## 🚦 Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm, yarn, pnpm, or bun
- Supabase account (for database)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd haven
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000/haven](http://localhost:3000/haven) in your browser

### Database Setup & Seeding

#### Seed Database with Listings
```bash
npm run seed
```
This will:
- Geocode 85 sample listings using OpenStreetMap Nominatim API (25 CA, 22 NY, 21 TX)
- Insert listings with latitude/longitude coordinates for state-based filtering demonstration
- Takes ~90 seconds due to rate limiting (1 request/second)

#### Check Geocoding Status
```bash
npm run check-geocoding
```
Shows which listings have coordinates and which are missing.

#### Clear All Listings
```bash
npm run clear-listings
```
Deletes all listings from the database (useful before re-seeding).

#### Reset Test User
```bash
npm run reset-user test@gmail.com
```
Resets user preferences, learned personalization, and swipe history for testing.

### Build for Production

```bash
npm run build
npm start
```

### Running Tests

The project uses **Vitest** with React Testing Library for comprehensive testing.

#### Run all tests
```bash
npm test
```

#### Run tests with UI dashboard
```bash
npm test:ui
```

#### Run tests with coverage report
```bash
npm test:coverage
```

#### Test Coverage

- **31 tests** across 4 test suites
- **UserContext** - 9 tests (authentication, preferences, localStorage)
- **HavenLogo** - 7 tests (rendering, sizes, animations)
- **Nickname Generator** - 5 tests (format, variety, validation)
- **CommutePreference** - 10 tests (user interactions, selections, callbacks)

All tests use:
- ✅ Vitest for fast test execution
- ✅ React Testing Library for component testing
- ✅ @testing-library/user-event for user interaction simulation
- ✅ jsdom for browser environment simulation

## 📖 Documentation

### Key Components

#### `CardStack`
Manages the stack of swipeable cards, handles swipe logic, and tracks liked listings.

**Props:**
- `listings`: Array of apartment listings
- `onLikedChange`: Callback when liked listings change
- `initialLikedIds`: Initial set of liked listing IDs
- `onViewLiked`: Callback to navigate to liked listings view
- `onCompletedChange`: Callback when all listings are completed

#### `SwipeableCard`
Individual apartment card with swipe gestures and animations.

**Features:**
- Drag to swipe or use arrow keys
- Image carousel navigation
- Visual feedback (LIKE/NOPE overlays)
- Smooth animations
- Error handling for failed image loads

#### `AddressInput`
Address input with autocomplete and map integration.

**Features:**
- Real-time address suggestions (OpenStreetMap API)
- Interactive map with Leaflet
- Current location detection
- Simplified address formatting

### State Management

The app uses React Context API and localStorage:
- **User Context**: Authentication, user type (searcher/manager), preferences
- **Dark Mode Context**: Theme preference with localStorage persistence
- **Local Storage Keys**:
  - `haven_users`: User accounts and credentials
  - `haven_manager_listings_{username}`: Manager's listings
  - `haven_listing_metrics`: Aggregated metrics per listing
  - `haven_listing_metric_events`: Timestamped events for trends
  - `haven_listing_changes`: Edit history for listings
  - `haven_listing_reviews_{listingId}`: Reviews per listing
  - `haven_liked_listings`: User's liked listings (synced from LikedListingsContext for personalization)
  - `haven_reviewed_listings`: All listings user has swiped on (for tracking swipe count)

### Metrics Tracking

The app tracks detailed metrics for analytics:

**Event Types:**
- `view`: User views a listing
- `swipeRight`: User likes a listing
- `swipeLeft`: User passes on a listing
- `unlike`: User removes a listing from liked list
- `share`: User shares a listing
- `review`: User submits or updates a review/rating

**Unique User Tracking:**
- Each user can only have ONE action (like OR pass) counted per listing
- If a user likes then passes, the like is removed and pass is counted
- Prevents double-counting and ensures accurate engagement metrics
- Reviews track rating changes over time per user

**Trends Calculation:**
- Real-time aggregation of events into time buckets
- Adaptive granularity (minute/hour/day) based on data range
- Rolling average rating calculation
- Price change markers correlated with engagement
- Cumulative counts for likes, passes, and shares

### Keyboard Shortcuts

**Swipe Interface:**
- **Arrow Left**: Swipe left (pass)
- **Arrow Right**: Swipe right (like)

### Manager Portal Features

**Dashboard Analytics:**
- View aggregated statistics across all listings
- Per-listing breakdown with detailed metrics
- Interactive trends charts showing:
  - Engagement over time (likes, passes, shares)
  - Price changes with impact on engagement
  - Average rating evolution
  - Minute-level granularity for fresh data

**Listing Management:**
- Create, edit, and delete listings
- Preview listings as they appear to users
- Share listing links via native share or copy
- Track all changes with timestamps

**Business Insights:**
- Like rate percentage (swipe right / total swipes)
- Review count and average rating
- Share count for viral potential
- Cross-reference pricing changes with user response

## 🗺️ 8-Week Execution Roadmap

### Week 1: Core UI & Demo ✅
- [x] Marketing landing page
- [x] Onboarding flow (Sign Up/Log In, Address, Commute)
- [x] Swipeable card stack with fake data
- [x] Liked listings view
- [x] Dark mode support
- [x] Address input with map and autocomplete
- [x] Responsive design
- [x] Smooth animations and transitions

### Week 2: Data Integration
- [ ] Connect to Supabase database
- [ ] Real apartment listings from database
- [ ] User authentication (Supabase Auth)
- [ ] Save user preferences (address, commute)
- [ ] Save liked listings to user profile
- [ ] Image upload for listings

### Week 3: AI Validation
- [ ] Integrate AI validation service
- [ ] Verify listing authenticity
- [ ] Quality scoring for listings
- [ ] Flag suspicious listings
- [ ] Automated listing moderation

### Week 4: Personalization ✅
- [x] User preference profiles with apartment criteria
- [x] Personalized listing recommendations with scoring algorithm
- [x] Behavioral learning from swipe patterns
- [x] Contrast learning (liked vs disliked analysis)
- [x] Distance-based ranking with geocoding:
  - **40% Location/Distance** (proximity to user's preferred address - PRIMARY FACTOR)
  - **35% Amenities** (learned from swipe behavior)
  - **15% Quality** (images, description completeness)
  - **10% Rating** (if available)
- [x] OpenStreetMap Nominatim API for geocoding addresses
- [x] Haversine formula for calculating geographic distance
- [x] Punishing distance scoring (50+ miles = 0%, essentially filtered out)
- [x] "Top Pick" badges for 80%+ match scores
- [x] "No preference" option to learn from behavior
- [x] Amenity preference learning with contrast analysis
- [x] Quality preference learning (images, descriptions)
- [x] LocalStorage synchronization for liked listings tracking
- [x] Immediate database persistence after 5 swipes

### Week 5: Roommate Matching
- [ ] User profile creation
- [ ] Compatibility matching algorithm
- [ ] Roommate search interface
- [ ] Messaging system
- [ ] Match notifications

### Week 6: Enhanced Features
- [ ] Listing detail pages
- [ ] Virtual tours integration
- [ ] Save searches
- [ ] Email notifications for new listings
- [ ] Social sharing

### Week 7: Testing & Optimization
- [x] Unit tests (31 tests across 4 test suites)
- [x] Test framework setup (Vitest + React Testing Library)
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness testing
- [ ] Bug fixes

### Week 8: Launch Preparation
- [ ] Campus-focused marketing materials
- [ ] Beta testing with select users
- [ ] Analytics integration
- [ ] Error monitoring
- [ ] Documentation finalization
- [ ] Production deployment

## 🎨 Design System

### Colors
- **Primary**: Indigo (`indigo-400`, `indigo-600`)
- **Success**: Green (`green-500`, `green-600`)
- **Error**: Red (`red-500`, `red-600`)
- **Background**: Light gradients in light mode, dark grays in dark mode

### Typography
- **Font**: Geist Sans (via Next.js)
- **Headings**: Bold, large sizes
- **Body**: Regular weight, readable sizes

### Components
- Rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-3xl`)
- Shadow effects for depth
- Smooth transitions and hover states
- Consistent spacing and padding

## 🔧 Configuration

### Environment Variables
Currently using public APIs (OpenStreetMap). For production, you may want to:
- Add Supabase environment variables
- Configure API keys for external services
- Set up image CDN URLs

### Next.js Config
- Image optimization configured for `images.unsplash.com`
- Tailwind CSS v4 with custom dark mode variant

## 🐛 Known Issues & Fixes

### Fixed Issues ✅
- ✅ **Distance not showing in score breakdown** - Fixed: Added latitude/longitude to ListingsContext mapping
- ✅ **Removed unused learned preferences** - Removed: learned price, bedrooms, bathrooms, sqft columns (were calculated but never used for filtering/scoring)
- ✅ **Removed unused location learning** - Removed: learned_preferred_locations feature (distance scoring is more accurate)
- ✅ **LocalStorage sync for liked listings** - Fixed: LikedListingsContext now saves to localStorage for personalization engine
- ✅ **Learned preferences not saving** - Fixed: Saves immediately at 5 swipes + on page exit
- ✅ **Distance ranking** - Fixed: Increased weight to 40%, punishing scoring for 50+ miles (0% score)

### Known Limitations
- Geocoding rate limit: 1 request/second (OpenStreetMap Nominatim)
- Some Unsplash images may fail to load (fallback UI implemented)
- Map tiles may require API key for higher usage

## 💰 Monetization Strategy

Haven uses a multi-layered monetization approach targeting both renters (demand side) and landlords (supply side), plus affiliate and ad revenue.

### 🟦 Category 1: Renter-Facing Monetization (Demand Side)

**High volume, high margin — core revenue early on**

#### 1. Early Access / "First Look" Premium (NEW — High-Value)

Renters get access to new listings 24–72 hours before free users, plus priority matching.

**Value proposition:** "See apartments BEFORE anyone else. Be first in line."

**Features:**
- Early access to all new listings
- Priority in lead queue to landlords
- Instant notifications on matching units
- Swipe priority (premium users see best listings sooner)

**Pricing options:**
- $4.99/mo (Basic First Look)
- $9.99/mo (Full Early Access + ad-free + AI suggestions)
- $1.99 one-time 48-hour Fast Pass

**Expected conversion:** 3–10% of active renters (Students + big cities: up to 15%)

#### 2. Premium Roommate Matching

A paid upgrade for users looking for roommates.

**Premium features:**
- "See who liked you"
- Compatibility scoring
- Verified roommate badges
- Lifestyle alignment filters
- Priority placement in roommate search

**Pricing:**
- $5.99/mo
- Or $29 one-time "Find me a match" bundle

#### 3. AI-Powered Apartment Search Premium

For renters willing to pay for speed and convenience.

**Includes:**
- AI-driven neighborhood fit
- AI filtering and ranking
- AI negotiation assistant
- AI-filled rental application forms
- Scam detection
- Market-rate comparison

**Pricing:** $7.99–$14.99/mo  
**Margin:** 95%+

#### 4. Ad Revenue (High CPM)

Non-intrusive ads in swipe flow or listing detail pages.

**Advertisers:**
- Movers
- Internet providers
- Furniture stores
- Storage services
- Cleaning services
- Renters insurance
- Credit/reporting partners

**Expected CPM:** $12–$30 (real-estate niche is premium)  
Ads alone can fully fund infra growth.

### 🟧 Category 2: Landlord/Property Manager Monetization (Supply Side)

**Recurring, high-ticket revenue — scales with inventory**

#### 5. Sponsored / Boosted Listings

Landlords pay to appear:
- At the top of swipes
- In "Featured" carousel
- With a badge
- More often in search

**Pricing:** $50–$300 per building per month (scales with portfolio size)

#### 6. Lead Generation Fees

Every time a user requests a tour or submits interest, you charge the landlord.

**Pricing:**
- $5–$20 per qualified lead for small landlords
- $20–$80 per lead for larger PMs
- Or 1–2% of annual rent for premium buildings

Highly scalable.

#### 7. Landlord Insight Dashboard (SaaS)

Data-as-a-service driven by swipe patterns.

**Features:**
- Demand heatmaps
- Rent competitiveness index
- Preferred amenities
- Real-time swipe rankings
- Pricing optimization

**Pricing:** $29–$199/mo depending on building count  
High retention, high ARR.

#### 8. Automated Lead Management / CRM Tools

Mini platform for landlords:
- Auto-respond to leads
- Auto-schedule tours
- Integrate with their leasing CRM
- Vacancy tracking

**Pricing:** $10–$100/mo or $1–$3 per active unit

### 🟩 Category 3: Transactional & Affiliate Revenue

#### 9. Deposit-Free Rental Partnerships

Work with insurance partners to offer:
- Deposit-free move-in
- ID verification
- Rent guarantee services

**Commission:** $20–$50 per activation  
Zero engineering beyond integration.

#### 10. Moving + Furniture + Internet Affiliate Sales

Renters need services immediately after finding a place.

**Monetize:**
- Internet plans (AT&T/Xfinity)
- Furniture bundles
- Mattresses
- Cleaners
- Moving trucks
- Storage units
- Renters insurance
- Utilities setup

**Commission:** $10–$150 per conversion

#### 11. Application/Background Check Partnerships

Integrate existing platforms like Checkr, TransUnion, or Certn.

**Revenue:** $5–$20 per screening or revenue-sharing

### 🟨 Category 4: Long-Term / Scale Monetization (Optional Future)

#### 12. Haven API for Housing Networks

Provide APIs for:
- Automated listing ingestion
- Bulk uploading
- Multi-city promotions
- Market intelligence

**Pricing:** Subscription or per-seat

#### 13. University/Corporate Housing Integrations

Bulk agreements with:
- Universities
- Intern housing programs
- Companies relocating employees

**Per-seat price:** $2–$10 per user per semester

### 🟫 Overall Monetization Architecture

Here's how the revenue layers stack in a mature Haven ecosystem:

| Layer | Monetization | Margin | Who Pays? |
|-------|-------------|--------|-----------|
| **Demand Tier** | First Look, AI Search, Roommate Premium | 95% | Renters |
| **Ads** | In-app ads | 100% | Advertisers |
| **Supply Tier** | Sponsored listings, Leads, SaaS | 90% | Landlords/PMs |
| **Affiliate Layer** | Movers, utilities, furniture | 50–70% | External partners |
| **Future Tier** | API, corporate, campus | 90–95% | Institutions |

**Revenue Strategy:** Multiple independent revenue engines targeting both sides of the marketplace plus affiliate + ad revenue, creating a financially strong business model.

## 💸 Funding Strategy

### Self-Funded Path (Recommended)

**Step 1**: Build demo with $0 infra (Vercel + Supabase + R2)

**Step 2**: Launch at 1–2 colleges

**Step 3**: Let students generate listings (crowdsourced)

**Step 4**: Get early revenue from small sponsors + promoted listings

**Step 5**: Raise a tiny angel round once you have proof

### Funding Sources

1. **College Ambassadors + Free Listings**
   - Universities promote for free
   - Students add listings for free
   - Grows inventory without paying landlords

2. **Local Small-Business Sponsorships**
   - $50–$200 promotional card ads
   - Moving companies, furniture stores, student housing
   - WiFi companies, renter's insurance brands
   - Can bootstrap to $5k–$15k early revenue

3. **Grants / Programs**
   - University incubators
   - State small-business grants
   - Google Cloud Startup Program
   - AWS Activate ($1k–$100k credits)
   - Y Combinator (later stage)

4. **Angel Round (After Traction)**
   - Target: $150k–$300k angel round
   - Requirements:
     - 500–2,000 users
     - 300+ listings
     - 20% weekly active rate
     - Cool swipe UX

5. **VC Money (Later Stage)**
   - Fast user growth (esp. on campuses)
   - Interesting AI personalization
   - Unique UX
   - Proof of revenue
   - Strong retention
   - Clear path to national expansion

## 📝 License

Private project - All rights reserved

## 👥 Contributing

This is a private project. For questions or suggestions, please contact the project maintainer.

---

**Built with ❤️ using Next.js and React**
