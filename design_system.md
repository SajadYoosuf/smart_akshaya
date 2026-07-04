# Smart Akshaya Design System

Welcome to the Smart Akshaya design system. Follow these guidelines and UI patterns when integrating or creating new pages to ensure a consistent, premium, and modern aesthetic across both the Web (React) and Windows (Flutter) platforms.

## Core Philosophy
1. **Spacious & Clean:** Utilize generous padding and airy layouts.
2. **Glassmorphism:** Emphasize depth through `.glass-panel` and `.glow-card` styles, subtle borders, and soft shadows.
3. **Vibrant Accents:** Use carefully chosen gradients for Hero Banners and FABs (Floating Action Buttons) to draw attention and evoke a premium feel.
4. **Consistency:** All tables, inputs, and modals must share the exact same visual language.

---

## 1. Color Palette

### Base Theme
- **Background (App Base):** `#F1F5F9` (Slate 100) or Transparent (if inheriting from a global wrapper).
- **Surface (Cards/Modals):** `#FFFFFF`
- **Text Primary:** `#1E293B` (Slate 800)
- **Text Secondary:** `#64748B` (Slate 500)
- **Borders:** `#E2E8F0` (Slate 200)

### Gradients (Hero Banners)
- **Dashboard (Welcome):** `[#3B82F6, #4F46E5]` (Blue to Indigo)
- **Service Entry:** `[#4F46E5, #7C3AED]` (Indigo to Purple)
- **Service Management:** `[#4F46E5, #7C3AED]` (Indigo to Purple)
- **Wallet Management:** `[#0D9488, #059669]` (Teal to Emerald)
- **Service Reports:** `[#2563EB, #3B82F6]` (Dark Blue to Blue)
- **Staff Management:** `[#EA580C, #E11D48]` (Orange to Rose)
- **Sidebar (Gradient):** `[#0F172A, #1E293B]` (Slate 900 to Slate 800)

### State Colors
- **Success:** `#10B981` (Emerald) / Background: `#ECFDF5`
- **Warning:** `#F59E0B` (Amber) / Background: `#FEF3C7`
- **Error/Negative:** `#EF4444` (Red) / Background: `#FEF2F2`
- **Info/Neutral:** `#3B82F6` (Blue) / Background: `#EFF6FF`

---

## 2. Typography
- **Font Family:** Inherits system default (Inter or Roboto preferred).
- **Hero Title:** 32px, Extra Bold (`800`), tracking `-0.5px`.
- **Section Headers:** 18px-24px, Bold (`700`), text color `#1E293B`.
- **Table Headers:** 12px, Bold (`700`), uppercase, letter-spacing `0.5px`, color `#64748B`.
- **Standard Text:** 14px, Medium (`500`), color `#1E293B`.

---

## 3. Core Components

### Hero Banner
Used at the top of main pages to provide context and summarize key metrics.
**CSS/React Example:**
```jsx
<div style={{
  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  borderRadius: '24px',
  padding: '32px 40px',
  color: 'white',
  boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  {/* Content */}
</div>
```

### Glow Cards (Stat Cards & Layout Panels)
Used for wrapping main content areas and displaying statistics.
**CSS/React Example:**
```jsx
<div style={{
  background: '#FFFFFF',
  borderRadius: '20px',
  padding: '24px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
  transition: 'transform 0.2s, box-shadow 0.2s' // For hover states
}}>
  {/* Content */}
</div>
```

### Data Tables
- **Wrapper:** Should be housed inside a Glow Card with no padding if it spans full width.
- **Header Row:** Background `#F8FAFC`, border-bottom `1px solid #E2E8F0`.
- **Data Rows:** Background `#FFFFFF`, border-bottom `1px solid #F1F5F9`. Hover state `backgroundColor: #F8FAFC`.
- **Cell Padding:** `16px 24px`.

### Badges (Status/Roles)
Used inside tables to denote status (Pending, Completed) or roles (Admin, Staff).
**CSS/React Example (Success Badge):**
```jsx
<span style={{
  backgroundColor: '#ECFDF5',
  color: '#10B981',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600'
}}>
  Completed
</span>
```

### Floating Action Button (FAB)
Positioned at the bottom-right for primary actions (Add Service, Add Staff).
- **Background:** Primary Gradient (e.g., `#4F46E5` to `#7C3AED`).
- **Icon Color:** `#FFFFFF`.
- **Shadow:** Extensive glow (e.g., `0 8px 25px rgba(79, 70, 229, 0.4)`).
- **Flutter Note:** Always assign a unique `heroTag` when using `FloatingActionButton` in Flutter.

### Inputs & Forms
- **Border:** `1px solid #E2E8F0`.
- **Border Radius:** `12px`.
- **Padding:** `12px 16px`.
- **Focus State:** Border `#3B82F6`, Box-Shadow `0 0 0 3px rgba(59, 130, 246, 0.1)`.
- **Background:** `#F8FAFC`.

---

## 4. Icons
- **Web App:** Use `lucide-react`. Ensure `size={20}` or `size={24}` depending on context. Avoid Material UI icons to maintain consistency.
- **Windows App:** Use Flutter's default `Icons` rounded variants (e.g., `Icons.dashboard_rounded`).

## 5. Modals / Dialogs
- **Backdrop:** Blur effect (`backdrop-filter: blur(4px)`) with `rgba(15, 23, 42, 0.6)`.
- **Container:** White background, `24px` border-radius, heavy shadow (`0 25px 50px -12px rgba(0, 0, 0, 0.25)`).
- **Header:** Clean title with a subtle close button (`X`) at the top right.
- **Actions:** Primary button on the right (filled), secondary button on the left (outlined).
