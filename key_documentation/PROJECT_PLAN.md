# Song Ranker - Project Plan

**Last Updated**: January 16, 2025  
**Status**: 🚧 **In Development** - Initial Setup Phase  
**Current Phase**: Phase 0 - Foundation & Setup

---

## 📊 **Executive Summary**

Song Ranker is an interactive web application that determines a user's personalized ranking of songs from a fixed catalog by asking them to make repeated pairwise comparisons. The application is designed to feel lightweight, fast, and slightly addictive, encouraging users to continue making choices until a full ranking emerges.

### **Repository Structure**

**This Repository (Frontend)**:
- **Location**: https://github.com/svadrutk/songranker.git
- **Type**: Next.js frontend application
- **Purpose**: User interface, client-side logic, UI components

**Backend Repository**:
- **Git Repository**: https://github.com/svadrutk/songranker-backend.git
- **Type**: Backend code repository (SQL migrations, functions, schema)
- **Purpose**: Database schema, SQL functions, migrations, backend logic
- **Database Host**: Supabase (https://loqddpjjjakaqgtuvoyn.supabase.co)
- **Note**: Backend work is implemented in the backend repository and deployed to Supabase. Git logs from the backend repo are used to track changes in this documentation.

### **Project Overview**

**Assignment**: Music Preference Sorter  
**Purpose**: Build an interactive web application for ranking songs through pairwise comparisons  
**Approach**: Minimize comparisons while producing accurate total ordering based on user preferences  
**Architecture**: Frontend (Next.js) + Backend (Supabase PostgreSQL)

### **Current Status**:
- ✅ Next.js application initialized
- ✅ Supabase database connected
- ✅ Git repository connected
- ✅ Documentation structure established
- ✅ Ranking algorithm selected: **Bradley-Terry Model** (see Technical Reference)
- ✅ Hybrid SQL/TypeScript architecture framework established
- ✅ UI component system (shadcn/ui) and dark mode implemented
- 🚧 Core features: Not yet implemented
- 🚧 Database schema: Design in progress
- 🚧 Ranking algorithm implementation: Not yet started

### **Key Metrics**:
- **Frontend Stack**: Next.js 16.1.3, React 19.2.3, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + backend services)
- **Frontend Repository**: https://github.com/svadrutk/songranker.git
- **Backend Repository**: https://github.com/svadrutk/songranker-backend.git
- **Database Host**: Supabase (https://loqddpjjjakaqgtuvoyn.supabase.co)
- **Target Dataset Size**: 50-200 items

---

## 🎯 **Project Goals**

1. **Produce Total Ordering**: Generate a complete ranking of items based solely on user preferences
2. **Minimize Comparisons**: Reduce the number of pairwise comparisons required to reach a stable ordering
3. **Handle Ambiguity**: Gracefully handle incomplete or ambiguous user input
4. **Provide Satisfaction**: Deliver a satisfying and shareable end result

---

## 📅 **Development Timeline**

Phases are organized by their overall development goals. Each category represents a major milestone in the project.

---

## 🏗️ **Category 1: Project Foundation**

### **Phase 0: Foundation & Setup** 🚧 **IN PROGRESS**
**Date**: January 2025  
**Status**: 🚧 In Progress

**Deliverables**:
- ✅ Next.js project initialized
- ✅ Supabase connection configured
- ✅ Git repository connected
- ✅ Documentation structure established
- ✅ Project requirements documented
- ✅ Ranking algorithm selected: **Bradley-Terry Model** (see Technical Reference for details)
- 🚧 Database schema design (optimized for Bradley-Terry data collection)
- 🚧 Ranking algorithm implementation

**Next Steps**:
- Design database schema for songs, comparisons, and rankings (supporting Bradley-Terry model)
- Implement Bradley-Terry parameter estimation (MM or Newton-Raphson algorithm)
- Design user interface for pairwise comparisons
- Implement comparison flow with adaptive pair selection

---

## 🗄️ **Category 2: Database Implementation**

### **Phase 1: Database Schema Design** 📋 **PLANNED**
**Status**: 📋 Planned

**Objective**: Design the database schema to support Bradley-Terry ranking algorithm

**Deliverables**:
- Review planned schema in PROJECT_PLAN.md
- Decide on exact field types and sizes
- Plan relationships between tables
- Identify needed constraints
- Identify needed indexes

**Learning Focus**:
- PostgreSQL data types (UUID, VARCHAR, TEXT, JSONB, ENUM, TIMESTAMP)
- Table relationships and foreign keys
- Schema design best practices

---

### **Phase 2: Database Table Creation** 📋 **PLANNED**
**Status**: 📋 Planned

**Objective**: Create all database tables with proper structure

**Deliverables**:
- CREATE TABLE for `songs`
- CREATE TABLE for `sessions`
- CREATE TABLE for `comparisons`
- CREATE TABLE for `rankings`
- Test each table creation in Supabase SQL Editor

**Learning Focus**:
- PostgreSQL CREATE TABLE syntax
- Column definitions with types
- Primary keys and foreign keys
- Default values

---

### **Phase 3: Database Constraints & Indexes** 📋 **PLANNED**
**Status**: 📋 Planned

**Objective**: Add data integrity constraints and performance indexes

**Deliverables**:
- CHECK constraints (e.g., `item_a_id != item_b_id`)
- UNIQUE constraints (prevent duplicate comparisons)
- Foreign key constraints with appropriate ON DELETE behavior
- Indexes on frequently queried columns
- Composite indexes for multi-column queries

**Learning Focus**:
- Constraint types and when to use them
- Index design for query performance
- Balancing data integrity vs performance

---

### **Phase 4: Database Testing & Validation** 📋 **PLANNED**
**Status**: 📋 Planned

**Objective**: Test schema with sample data and validate design

**Deliverables**:
- Insert test songs
- Create test session
- Insert test comparisons
- Test queries needed for application
- Verify constraints work correctly
- Validate foreign key relationships

**Learning Focus**:
- SQL INSERT statements
- SQL SELECT queries
- Testing data integrity
- Query optimization

---

### **Phase 5: Database Views (Optional)** 📋 **OPTIONAL**
**Status**: 📋 Optional

**Objective**: Create useful views for common queries

**Deliverables**:
- `comparison_stats` view - aggregated comparison data
- `session_progress` view - progress calculations
- `song_comparison_counts` view - comparison frequency

**Learning Focus**:
- CREATE VIEW syntax
- When views are useful vs direct queries
- Querying views

---

### **Phase 6: Database Documentation** 📋 **PLANNED**
**Status**: 📋 Planned

**Objective**: Document final database schema

**Deliverables**:
- Update PROJECT_PLAN.md with final schema
- Document table purposes and relationships
- Document constraints and indexes
- Note any design decisions or deviations

**Learning Focus**:
- Database documentation best practices
- Schema versioning

---

## 🎯 **Category 3: Core Application Features**

### **Phase 7: Core Functionality** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Dataset management (swappable song catalog)
- Pairwise comparison interface
- Preference collection and storage
- Basic ranking algorithm implementation
- Progress tracking

---

## 📊 **Category 4: Ranking System**

### **Phase 8: Ranking & Completion** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Complete ranking algorithm
- Results display screen
- Completion conditions and confidence thresholds
- Restart functionality

---

## ✨ **Category 5: Polish & Quality Assurance**

### **Phase 9: Polish & Edge Cases** 📋 **PLANNED**
**Status**: 📋 Planned

**Deliverables**:
- Handle non-transitive preferences
- Resolve contradictions deterministically
- Handle incomplete preference graphs
- Mobile responsiveness
- Error handling and recovery

---

## 🚀 **Category 6: Future Enhancements**

### **Phase 10: Stretch Goals** 📋 **OPTIONAL**
**Status**: 📋 Optional

**Deliverables**:
- Item exclusion before starting
- Shareable results (link/image)
- Confidence levels for rankings
- Multiple dataset support

---

## 🏗️ **Technical Architecture**

### **Frontend Architecture** (This Repository)
- **Framework**: Next.js 16.1.3 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Font**: Geist (via next/font)
- **Component Library**: shadcn/ui
- **State Management**: React hooks and context

### **Backend Architecture**
- **Backend Repository**: https://github.com/svadrutk/songranker-backend.git
- **Database**: PostgreSQL (hosted on Supabase)
- **Database Host**: https://loqddpjjjakaqgtuvoyn.supabase.co
- **Client Library**: @supabase/supabase-js 2.90.1 (used in frontend)
- **Backend Work**: Database schema, SQL functions, stored procedures, views, migrations
- **Connection**: Configured via environment variables in frontend

**Note**: Backend work is developed in the backend git repository, deployed to Supabase, and tracked in this frontend repository's documentation. Git logs from the backend repo can be analyzed to automatically update this documentation.

### **Development Tools**
- **Linting**: ESLint 9 with Next.js config
- **Package Manager**: npm
- **Version Control**: Git (frontend repository)

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

### **Backend Implementation Location**

**Backend Repository**: https://github.com/svadrutk/songranker-backend.git  
**Database Host**: Supabase (https://loqddpjjjakaqgtuvoyn.supabase.co)

**Important**: Database schema, SQL functions, and all backend work is:
- **Developed** in the backend git repository
- **Deployed** to Supabase database
- **Tracked** in this frontend repository's documentation

**How Backend Work is Tracked**:
- Git logs from backend repository are analyzed to extract changes
- Database schema changes documented in this PROJECT_PLAN.md
- SQL functions and stored procedures documented in TECHNICAL_REFERENCE.md
- Backend decisions documented in DEVELOPMENT_LOG.md
- Automatic updates possible by reading backend repo git logs

### **Current Status**: Design Phase

Database schema will be designed to support:
- Song catalog storage
- User preference/comparison tracking
- Ranking results storage
- Session management

**Implementation Location**: Supabase PostgreSQL database

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
- `preference` (Enum: 'A', 'B', 'TIE') - Records \(w_{ij} = 1\) for Bradley-Terry model
- `created_at` (Timestamp)
- **Note**: This table stores pairwise comparison data for Bradley-Terry parameter estimation

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
- `score` (Float, Optional) - Bradley-Terry strength parameter \(p_i\)
- `confidence` (Float, Optional) - Confidence level from standard errors of parameter estimates
- `created_at` (Timestamp)
- **Note**: Strength parameters \(p_i\) are estimated via maximum likelihood from comparisons table

### **Supabase Configuration**

**Backend Repository**: https://loqddpjjjakaqgtuvoyn.supabase.co

**Frontend Connection**:
- **Client**: Configured in `lib/supabase.ts`
- **Environment Variables**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Backend Work Location**:
- Database schema: Created in Supabase SQL Editor
- SQL functions: Stored in Supabase (can be exported/migrated)
- Views: Created in Supabase SQL Editor
- All backend work is tracked in this documentation but implemented in Supabase

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
- **Status**: ❌ Not selected

#### **Option 2: Bradley-Terry Model** ✅ **SELECTED**
- Pros: Statistical model designed for pairwise comparisons
- Cons: More complex implementation
- **Status**: ✅ **SELECTED** - See Technical Reference for full details
- **Rationale**: 
  - Specifically designed for pairwise comparison ranking
  - Handles incomplete comparison graphs (users can refresh/resume)
  - Naturally handles non-transitive preferences and contradictions
  - Provides confidence scores for ranking positions (supports stretch goal)
  - Probabilistic approach treats user choices as statistical observations
  - Supports adaptive questioning to minimize comparisons
- **Reference**: See `TECHNICAL_REFERENCE.md` - Theoretical Concepts section

#### **Option 3: Custom Algorithm**
- Pros: Tailored to specific requirements
- Cons: Requires more design and testing
- **Status**: ❌ Not selected

### **Decision**: ✅ **Bradley-Terry Model Selected**
- **Selection Date**: January 2025
- **Documentation**: Full details in `TECHNICAL_REFERENCE.md` - Theoretical Concepts
- **Implementation Notes**: 
  - Use MM (minorization-maximization) or Newton-Raphson for parameter estimation
  - Implement adaptive pair selection based on model uncertainty
  - Track confidence via Fisher information matrix
  - Minimum comparisons: \(n-1\) (theoretical), \(O(n \log n)\) (practical)

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
**Last Updated**: January 16, 2025  
**Next Update**: After Phase 0 completion or major architectural changes
