# 💎 Bawaal 2.0: Internal Intelligence & Architecture Documentation

## 🚀 Project Overview
**Bawaal 2.0** is an ultra-premium, real-time communication platform engineered with a "GOAT level" UI/UX philosophy. It leverages a modern tech stack to provide seamless messaging, high-fidelity calling, and a sophisticated intelligence layer for user identities.

---

## 🛠 Technical Stack
*   **Frontend**: React (TSX) + Vite
*   **Styling**: Tailwind CSS (Custom Utility Engine)
*   **Backend/Database**: Supabase (PostgreSQL + Realtime)
*   **State Management**: Zustand (Atomic Stores)
*   **Authentication**: Supabase Auth + Google OAuth
*   **Communications**: WebRTC (Signaling via Supabase)
*   **Icons**: Lucide React (Premium Iconography)

---

## 🎨 Design System: "The GOAT Standard"
All UI components must adhere to the following design tokens and principles:

### ⚡ Core Aesthetics
*   **Glassmorphism**: Use `bg-white/[0.03] backdrop-blur-[40px] border border-white/10`.
*   **Mesh Gradients**: The `.bg-mesh` utility provides a complex, multi-layered radial gradient system (Emerald, Cyan, Purple).
*   **Typography**: 
    *   Headers: `font-black tracking-tighter uppercase`.
    *   Subtitles/Action Labels: `text-[10px] font-black tracking-[0.3em] uppercase`.
*   **Animations**:
    *   `animate-pulse-slow`: Subtle periodic shifts in background depth.
    *   `animate-in fade-in slide-in-from-bottom`: Smooth entry transitions for all cards.

---

## 🏗 Key Architectural Components

### 1. 💬 Messaging Engine (`ChatWindow.tsx`)
*   **Optimistic UI**: Messages are rendered instantly and synced with Supabase in the background.
*   **Media Support**: Includes custom players for Voice Messages (`VoicePlayer`) and an integrated `ReactionPicker`.
*   **Encryption**: Visual indicators for end-to-end encrypted protocol tunnels.

### 2. 📞 Communication Protocol (`CallOverlay.tsx`)
*   **WebRTC Integration**: Handles P2P video and voice calling.
*   **Ambient UI**: Dynamic pulse rings and background mesh transitions during active sessions.
*   **Multi-Modal**: Supports Screen Sharing, Camera Switching, and Muting.

### 3. 🛡 Identity & Intelligence Layer (`ContactInfoSidebar.tsx`)
*   **Data Segments**: Fetches shared media (images/videos) across the conversation timeline.
*   **Access Control**: Centralized logic for Blocking/Unblocking and Clearing Terminals.

---

## 🔐 Authentication & Security Flow
*   **Provider**: Supabase Auth.
*   **Identity Sync**: Upon login (Google or Email), the system ensures a record exists in both `users` (Identity) and `profiles` (Settings) tables via an upsert mechanism.
*   **Privacy**: Identity layers include `last_seen` status and `privacy_settings` stored in the `profiles` table.

---

## 💾 State Management (Zustand Stores)
*   **`useAuthStore`**: Manages global user session, profile refreshes, and auth status.
*   **`useChatStore`**: Centralized hub for:
    *   Active Conversations & Messages.
    *   Online Presence (`onlineUsers` Set).
    *   Typing Statuses.
    *   Calling Sessions.
    *   UI Toggles (Sidebars, Image Viewers).

---

## 📡 Real-time Synchronization
*   **Global Presence**: Managed via `subscribeToGlobalPresence` in `chatService`. Tracks user IDs globally regardless of active chat.
*   **Typing Pulse**: Low-latency broadcast channels trigger "Typing..." indicators.
*   **Message Hooks**: Postgres Changes listener in `ChatPage.tsx` ensures instant message delivery.

---

## 📏 Maintenance Standards
1.  **No Placeholders**: Never use generic gray boxes; use generated imagery or gradients.
2.  **Performance**: Ensure high-fidelity animations do not block the main thread (use GSAP or CSS transforms).
3.  **Mobile-First**: Every feature must be tested on a 390px width (iPhone 12/13/14/15/16) and a 430px width (Pro Max).
4.  **Premium Feedback**: Every button click must provide visual feedback (scaling down/up or shimmering).

---

© 2026 BAWAAL CORE DEVELOPMENT TEAM // ENTER CORE
