# Haven — Apartment Swiping App

A modern apartment discovery platform with a Tinder-like swipe interface. Find your perfect apartment by swiping through verified listings, get personalized recommendations, and connect with potential roommates.

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

- **Liked Listings**
  - View all apartments you've swiped right on
  - Grid view and detailed view
  - Remove listings from liked collection
  - Image carousel support

- **Dark Mode**
  - System-wide dark mode support
  - Persistent user preference (localStorage)
  - Toggle button in navigation
  - Smooth theme transitions

- **Address Input with Geo-UX**
  - Real-time address autocomplete (OpenStreetMap/Nominatim)
  - Interactive map view (Leaflet)
  - Current location detection
  - Simplified address formatting
  - Visual map updates on selection

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.3
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Maps**: Leaflet & React Leaflet
- **Language**: TypeScript
- **Deployment**: Vercel-ready
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI Services**: HuggingFace Inference API (free tier)

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
│   ├── layout.tsx          # Root layout with dark mode provider
│   ├── page.tsx             # Main page with view state management
│   └── globals.css          # Global styles and Tailwind config
├── components/
│   ├── LandingPage.tsx      # Marketing landing page
│   ├── OnboardingLanding.tsx # Sign Up/Log In page
│   ├── AddressInput.tsx     # Address input with autocomplete & map
│   ├── CommutePreference.tsx # Commute options selection
│   ├── CardStack.tsx        # Swipeable card stack container
│   ├── SwipeableCard.tsx    # Individual apartment card
│   ├── LikedListings.tsx    # Liked listings view
│   ├── HavenLogo.tsx        # Reusable logo component
│   ├── DarkModeToggle.tsx  # Dark mode toggle button
│   └── MapView.tsx          # Interactive map component
├── contexts/
│   └── DarkModeContext.tsx  # Dark mode state management
└── lib/
    └── data.ts              # Fake apartment listings data
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

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

The app uses React's `useState` for local state management:
- View state: `marketing` | `onboarding` | `address` | `commute` | `swipe` | `liked`
- Liked listings: Stored as a `Set<string>` of listing IDs
- Onboarding data: User address and commute preferences
- Dark mode: Managed via Context API with localStorage persistence

### Keyboard Shortcuts

- **Arrow Left**: Swipe left (pass)
- **Arrow Right**: Swipe right (like)

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
- [ ] Unit tests
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
