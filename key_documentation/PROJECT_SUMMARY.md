# Song Ranker - Project Summary

**Last Updated**: January 2026  
**Status**: ✅ Core Features Complete

---

## 🎯 **What It Is**

**Song Ranker** (rebranded as **Chorusboard**) is a web application that generates personalized song rankings through pairwise comparisons. Instead of asking users to rank 50-200 songs at once, it presents two songs at a time and builds a complete ranking from their choices.

---

## 🏗️ **Architecture**

**Two-Repository Structure**:
- **Frontend**: Next.js 16 + TypeScript + React 19 (TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python) + Supabase PostgreSQL + Redis/RQ workers

**Key Innovation**: Hybrid ranking system
- **Frontend**: Elo rating for instant visual feedback
- **Backend**: Bradley-Terry Model for statistical accuracy

---

## 🔄 **How It Works**

1. **Search & Select**: User searches artists/albums via MusicBrainz API
2. **Deduplicate**: Smart fuzzy matching identifies and merges duplicate songs
3. **Rank**: User makes pairwise comparisons (Song A vs Song B)
4. **Calculate**: Backend computes statistical rankings using Bradley-Terry model
5. **Share**: Generate social media card with top 10 rankings

---

## 🎨 **Key Features**

- **Smart Deduplication**: Fuzzy matching prevents duplicate songs in rankings
- **Instant Feedback**: Optimistic UI updates make choices feel immediate
- **Statistical Accuracy**: Bradley-Terry model ensures mathematically sound rankings
- **Session Management**: Save and resume ranking sessions
- **Social Sharing**: Generate Instagram Story-style share cards
- **Global Leaderboards**: Aggregate rankings across all users (in progress)

---

## 📊 **Technical Highlights**

**Frontend**:
- Elo rating system (K=32) for real-time updates
- Adaptive pairing (selects similar-strength songs for maximum information gain)
- Seamless sync pattern (background updates don't interrupt user flow)
- Local caching with SWR pattern for instant session loading

**Backend**:
- Bradley-Terry MM algorithm for parameter estimation
- Background workers (Redis/RQ) for non-blocking calculations
- Convergence tracking (0-100% progress indicator)
- Redis caching for performance

**Database**:
- Supabase PostgreSQL with Row Level Security
- Tables: `sessions`, `songs`, `comparisons`, `artist_stats`

---

## 🚀 **Current Status**

**Completed** ✅:
- Phase 1-7: Core ranking features, deduplication, session management, social sharing

**In Progress** 🚧:
- Phase 8: Global rankings and analytics

---

## 📈 **User Flow**

```
Search Artist → Select Albums → Review Duplicates → 
Start Ranking → Make Comparisons → View Results → Share
```

**Typical Session**: 15-50 comparisons for 50-200 songs, ~5-15 minutes

---

## 🎓 **Why It Matters**

- **Solves Real Problem**: Ranking large lists is overwhelming; pairwise comparisons are manageable
- **Mathematically Sound**: Bradley-Terry model is the gold standard for preference ranking
- **Great UX**: Instant feedback keeps users engaged, background calculations ensure accuracy
- **Shareable**: Social cards encourage viral growth (like Spotify Wrapped)

---

## 🔗 **Repositories**

- **Frontend**: https://github.com/svadrutk/songranker-frontend.git
- **Backend**: https://github.com/svadrutk/songranker-backend.git
- **Database**: Supabase (https://loqddpjjjakaqgtuvoyn.supabase.co)

---

**Tech Stack**: Next.js 16, React 19, TypeScript, FastAPI, PostgreSQL, Redis  
**Status**: Production-ready core features, enhancements in progress
