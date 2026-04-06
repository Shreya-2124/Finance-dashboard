# Finvyn | Personal Finance Dashboard

[![Live Demo](https://img.shields.io/badge/Live-Demo-emerald.svg)](#) *(https://finance-dashboard-eosin-theta.vercel.app/)*

Finvyn is a production-grade, highly responsive personal finance dashboard built to track expenses, visualize spending trends, and manage monthly budgets. 

## Key Features
- **Smart Insights & Savings Rate:** Automated financial analysis providing actionable feedback and dynamic savings rate calculations.
- **Dynamic Budget Tracker:** Interactive, persistent budget cap with a visual progress bar.
- **Advanced Data Table:** Multi-column sorting (Date/Amount), full-text search, category filtering, and custom Empty States.
- **Dual-Mode UI:** Seamless switching between Dark (Metallic) and Light modes.
- **Role-Based Access:** Admin (full edit/delete access) and Viewer (read-only) modes.
- **Data Portability:** One-click CSV export for all transaction records.
- **Custom Modals:** Eliminated native browser alerts in favor of fully customized React portals.

##  Tech Stack
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Charts:** Recharts (Custom Tooltips & Snap-Animations)
- **State Management:** React Hooks (`useMemo`, `useCallback`) + `localStorage`

##  Running Locally
1. Clone the repository: `git clone https://github.com/Shreya-2124/Finance-dashboard`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Architecture Notes
The application was built with a "Mobile-First" mindset. The dashboard utilizes a custom horizontal scroll container for data tables and a bento-grid layout for charts, ensuring a 100% functional experience from desktop to mobile viewports.
