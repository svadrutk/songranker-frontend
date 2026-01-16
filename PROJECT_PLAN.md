# Song Ranker - Project Plan

**Last Updated**: January 2025  
**Status**: 🚧 **In Development** - Initial Setup Phase  
**Current Phase**: Phase 0 - Foundation & Setup

---

## 📊 **Executive Summary**

Song Ranker is an interactive web application that determines a user's personalized ranking of songs from a fixed catalog by asking them to make repeated pairwise comparisons. The application is designed to feel lightweight, fast, and slightly addictive, encouraging users to continue making choices until a full ranking emerges.

### **Project Overview**

**Assignment**: Music Preference Sorter  
**Purpose**: Build an interactive web application for ranking songs through pairwise comparisons  
**Approach**: Minimize comparisons while producing accurate total ordering based on user preferences

### **Current Status**:
- ✅ Next.js application initialized
- ✅ Supabase database connected
- ✅ Git repository connected
- ✅ Documentation structure established
- 🚧 Core features: Not yet implemented
- 🚧 Database schema: Not yet defined
- 🚧 Ranking algorithm: Not yet implemented

### **Key Metrics**:
- **Tech Stack**: Next.js 16.1.3, React 19.2.3, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Repository**: https://github.com/svadrutk/songranker.git
- **Supabase URL**: https://loqddpjjjakaqgtuvoyn.supabase.co
- **Target Dataset Size**: 50-200 items

---

## 🎯 **Project Goals**

1. **Produce Total Ordering**: Generate a complete ranking of items based solely on user preferences
2. **Minimize Comparisons**: Reduce the number of pairwise comparisons required to reach a stable ordering
3. **Handle Ambiguity**: Gracefully handle incomplete or ambiguous user input
4. **Provide Satisfaction**: Deliver a satisfying and shareable end result

---

## 📅 **Development Timeline**

### **Phase 0: Foundation & Setup** 🚧 **IN PROGRESS**
**Date**: January 2025  
**Status**: 🚧 In Progress

**Deliverables**:
- ✅ Next.js project initialized
- ✅ Supabase connection configured
- ✅ Git repository connected
- ✅ Documentation structure established
- ✅ Project requirements documented
- 🚧 Database schema design
- 🚧 Ranking algorithm design

**Next Steps**:
- Design database schema for songs, comparisons, and rankings
- Research and select ranking algorithm (e.g., Elo, Bradley-Terry, or custom)
- Design user interface for pairwise comparisons
- Implement comparison flow

### **Phase 1: Core Functionality** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Dataset management (swappable song catalog)
- Pairwise comparison interface
- Preference collection and storage
- Basic ranking algorithm implementation
- Progress tracking

### **Phase 2: Ranking & Completion** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Complete ranking algorithm
- Results display screen
- Completion conditions and confidence thresholds
- Restart functionality

### **Phase 3: Polish & Edge Cases** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Handle non-transitive preferences
- Resolve contradictions deterministically
- Handle incomplete preference graphs
- Mobile responsiveness
- Error handling and recovery

### **Phase 4: Stretch Goals** 📋 **OPTIONAL**
**Status**: 📋 Optional

**Deliverables**:
- Item exclusion before starting
- Shareable results (link/image)
- Confidence levels for rankings
- Multiple dataset support

---

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 16.1.3 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Font**: Geist (via next/font)

### **Backend/Database**
- **Database**: Supabase (PostgreSQL)
- **Client Library**: @supabase/supabase-js 2.90.1
- **Connection**: Configured via environment variables

### **Development Tools**
- **Linting**: ESLint 9 with Next.js config
- **Package Manager**: npm
- **Version Control**: Git

---

## 🎯 **Feature Implementation**

### **Functional Requirements**

#### **1. Dataset Management**
- ✅ Accept predefined list of items (songs)
- ✅ Each item must have:
  - Unique identifier
  - Display name
- ✅ Dataset must be swappable without changing application logic
- 🚧 Implementation: Not yet started

#### **2. Comparison Flow**
- 🚧 Present two distinct items to user repeatedly
- 🚧 User selection options:
  - Item A (preferred)
  - Item B (preferred)
  - Optional: "Tie / No Preference"
- 🚧 Avoid showing same comparison repeatedly unless necessary
- 🚧 Implementation: Not yet started

#### **3. Preference Collection**
- 🚧 Record each user choice as preference constraint
- 🚧 Handle non-transitive preferences
- 🚧 Handle user contradictions
- 🚧 Continue gathering data until stable ordering possible
- 🚧 Implementation: Not yet started

#### **4. Ranking Output**
- 🚧 Generate ranked list (highest to lowest preference)
- 🚧 Handle grouping/tie-handling for "no preference" choices
- 🚧 Rankings must be reproducible from recorded preferences
- 🚧 Implementation: Not yet started

#### **5. Progress & Completion**
- 🚧 Display progress feedback:
  - Percentage complete
  - Estimated comparisons remaining
- 🚧 Define clear completion conditions:
  - All necessary comparisons completed, OR
  - Confidence threshold reached
- 🚧 Allow user to restart process
- 🚧 Implementation: Not yet started

### **Non-Functional Requirements**

#### **Performance**
- 🚧 Remain responsive with 50-200 items
- 🚧 Page transitions feel instant
- 🚧 Implementation: Not yet started

#### **Usability**
- 🚧 Usable with mouse or keyboard only
- 🚧 Choices visually distinct and unambiguous
- 🚧 Mobile support (optional but encouraged)
- 🚧 Implementation: Not yet started

#### **Reliability**
- 🚧 Handle page refresh gracefully
- 🚧 Handle mid-flow abandonment
- 🚧 Recover partial progress
- 🚧 Implementation: Not yet started

### **UX Requirements**

#### **Comparison Screen**
- 🚧 Two items displayed side by side
- 🚧 Clear call-to-action buttons
- 🚧 Optional "equal" or "skip" affordance
- 🚧 Implementation: Not yet started

#### **Results Screen**
- 🚧 Scrollable ranked list
- 🚧 Visual separation between ranks
- 🚧 Optional metadata (comparisons count, time taken)
- 🚧 Implementation: Not yet started

### **Constraints & Edge Cases**

#### **User Behaviors to Handle**
- 🚧 Users may always pick left option
- 🚧 Users may frequently choose "tie"
- 🚧 Users may change mind implicitly through later choices
- 🚧 Implementation: Not yet started

#### **System Requirements**
- 🚧 Avoid infinite loops
- 🚧 Resolve contradictions deterministically
- 🚧 Handle incomplete preference graphs
- 🚧 Implementation: Not yet started

### **Stretch Goals** (Optional)

- 📋 Allow users to exclude items before starting
- 📋 Generate shareable link or image of results
- 📋 Show "confidence" levels for each ranking position
- 📋 Support multiple datasets (albums, eras, artists)

### **Implemented Features**
- None yet (project in initial setup phase)

---

## 📁 **Project Structure**

```
Song Ranker/
├── app/                          # Next.js App Router pages
│   ├── favicon.ico
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── lib/                         # Utility libraries
│   └── supabase.ts             # Supabase client configuration
├── public/                      # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── DOCUMENTATION_REQUIREMENTS.md # Documentation guide
├── PROJECT_PLAN.md             # This file
├── DEVELOPMENT_LOG.md          # Development activity log
├── TECHNICAL_REFERENCE.md      # Technical documentation
├── README.md                   # Project overview
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── next.config.ts              # Next.js config
├── postcss.config.mjs          # PostCSS config
└── eslint.config.mjs           # ESLint config
```

---

## 🗄️ **Database Schema**

### **Current Status**: Design Phase

Database schema will be designed to support:
- Song catalog storage
- User preference/comparison tracking
- Ranking results storage
- Session management

### **Planned Tables** (To Be Implemented)

#### **Songs Table**
- `id` (UUID, Primary Key)
- `name` (String) - Display name
- `artist` (String, Optional)
- `album` (String, Optional)
- `metadata` (JSON, Optional) - Additional song data
- `created_at` (Timestamp)

#### **Comparisons Table**
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `item_a_id` (UUID, Foreign Key to Songs)
- `item_b_id` (UUID, Foreign Key to Songs)
- `preference` (Enum: 'A', 'B', 'TIE')
- `created_at` (Timestamp)

#### **Sessions Table**
- `id` (UUID, Primary Key)
- `user_id` (String, Optional) - For future user accounts
- `dataset_id` (String) - Identifier for swappable dataset
- `status` (Enum: 'active', 'completed', 'abandoned')
- `progress` (Float) - Percentage complete
- `comparisons_count` (Integer)
- `created_at` (Timestamp)
- `completed_at` (Timestamp, Optional)

#### **Rankings Table**
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `song_id` (UUID, Foreign Key)
- `rank` (Integer) - Position in ranking (1 = highest)
- `score` (Float, Optional) - Algorithm score
- `confidence` (Float, Optional) - Confidence level
- `created_at` (Timestamp)

### **Supabase Configuration**
- **URL**: https://loqddpjjjakaqgtuvoyn.supabase.co
- **Client**: Configured in `lib/supabase.ts`
- **Environment Variables**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🚀 **Deployment**

### **Current Status**: Not Yet Deployed

Deployment configuration and production environment details will be documented here.

### **Development Environment**
- **Local Server**: http://localhost:3000
- **Start Command**: `npm run dev`

---

## 🧪 **Evaluation Criteria**

The solution will be evaluated on:

1. **Correctness of Ranking**: Accuracy of final ordering based on user preferences
2. **Efficiency of Comparisons**: Minimizing number of comparisons needed
3. **Robustness**: Handling inconsistent user input gracefully
4. **Clarity of UX**: Intuitive interface and clear feedback
5. **Code Structure**: Clean, extensible, maintainable codebase

---

## 📋 **Ranking Algorithm Considerations**

### **Approach Options**

#### **Option 1: Elo Rating System**
- Pros: Simple, well-understood, handles updates well
- Cons: May require many comparisons for stable ranking

#### **Option 2: Bradley-Terry Model**
- Pros: Statistical model designed for pairwise comparisons
- Cons: More complex implementation

#### **Option 3: Custom Algorithm**
- Pros: Tailored to specific requirements
- Cons: Requires more design and testing

### **Decision**: To Be Determined
- Algorithm selection will be documented in DEVELOPMENT_LOG.md
- Tradeoffs will be documented in README.md

---

## 📝 **Notes**

- Project initialized from Next.js create-next-app template
- Supabase connection established and tested
- Documentation structure established following Baseline project patterns
- Assignment requirements documented and integrated
- Ready for feature development and algorithm design

---

## 📚 **Deliverables**

### **Required**
- ✅ Working web application
- ✅ README explaining:
  - Ranking logic at high level
  - Tradeoffs made
  - Known limitations

### **Status**
- 🚧 Application: In development
- 🚧 README: Will be updated as development progresses

---

**Document Status**: ✅ **CURRENT** - Reflects project requirements and initial setup  
**Last Updated**: January 2025  
**Next Update**: After Phase 0 completion or major architectural changes
