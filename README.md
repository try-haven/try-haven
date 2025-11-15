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

### Core Monetization (Early Stage)

1. **Apartment Lead Fees (Referral Fees)**
   - $5–$20 per qualified lead for small landlords
   - $20–$80 per lead for large property managers
   - 1–2% of annual rent for high-end rentals
   - Main revenue driver

2. **Sponsored Listings (Boosted Apartments)**
   - $50–$300 per month per property
   - Appear earlier in swipe deck
   - "Top Pick" badges
   - High-margin revenue

3. **Ads (High-Volume, Low-Friction)**
   - Real estate niche CPM: $12–$30
   - Moving companies, internet providers, rental insurance
   - Furniture brands, storage companies
   - Banner ads + interstitials in swipe flow

### Secondary Monetization (Growth Stage)

4. **Roommate Matching Premium**
   - $5–$20/month subscription
   - See people who liked your profile
   - Advanced lifestyle filters
   - AI compatibility scoring
   - Priority placement

5. **AI-Powered Personalized Search**
   - $10–$25/month premium upgrade
   - AI negotiates rent
   - AI pre-fills application forms
   - AI compares prices
   - AI flags scam listings

6. **Data Subscriptions for Landlords**
   - $29–$199/month per landlord
   - Rent trends from swipes
   - Neighborhood amenity preferences
   - Real-time demand heatmaps
   - Market insights dashboards

### Future Monetization (Scale Stage)

7. **API + Integrations for Property Managers**
   - $100–$500 per building
   - Per-unit SaaS ($1–$3 per active unit)
   - Automatic listing ingestion
   - Automated lead management

8. **Guaranteed Rent / Deposit-Free Partnerships**
   - $20–$50 per contract commission
   - Partner with insurance providers
   - Credit-building rent-reporting

9. **Affiliate Sales**
   - $10–$100 commissions
   - Furniture bundles, WiFi plans, utilities
   - Moving trucks, cleaning services, storage

### Revenue Projections

- **Short term (0–12 months)**: Lead generation fees, sponsored listings, ads
- **Medium term (1–2 years)**: Premium roommate features, AI premium search
- **Long term (2–3 years)**: Analytics SaaS, API billing, deposit-free partnerships
- **Target margins**: 50–70% with high LTV and recurring revenue

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
