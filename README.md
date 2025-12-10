# Haven — Apartment Swiping App

A modern apartment discovery platform with a Tinder-like swipe interface. Find your perfect apartment by swiping through personalized listings tailored to your preferences and discover your next home.

## 🔑 Test Login Credentials

### Test User (Searcher)
- **Username**: `test`
- **Email**: `test@gmail.com`
- **Password**: `test1234`

### Test Manager (Property Manager)
- **Username**: `manager`
- **Email**: `manager@gmail.com`
- **Password**: `test1234`

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
- **Backend** (Future): Supabase (Postgres, Auth, Storage, Edge Functions)
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

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000/haven](http://localhost:3000/haven) in your browser

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
  - `haven_liked_listings_{username}`: User's liked listings
  - `haven_reviewed_listings_{username}`: User's reviewed listings

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

### Week 4: Personalization
- [ ] User preference profiles
- [ ] Personalized listing recommendations
- [ ] Filter system (price, location, amenities)
- [ ] Search functionality
- [ ] Recommendation algorithm

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

## 🐛 Known Issues

- Some Unsplash images may fail to load (fallback UI implemented)
- Map tiles may require API key for higher usage
- Address autocomplete rate limits (OpenStreetMap)

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
