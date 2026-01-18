# Ather Stats PWA 🛵📊

A sleek, performance-focused Progressive Web App (PWA) to visualize your Ather scooter's ride data.

## Features ✨

- **📊 Summary Page**: Daily, weekly, and monthly summaries with trend analysis
  - Compare periods with visual trend indicators
  - Click any period for detailed breakdown charts
  - Track active days and riding consistency
- **📈 Data Visualization**: Beautiful interactive charts for distance, efficiency, energy usage, and ride modes
- **🔍 Ride Analytics**: Detailed breakdown of every ride, including top speed, average speed, and duration
- **📅 Activity Heatmap**: GitHub-style activity heatmap to track your riding habits over the year
- **🌓 Dark/Light Mode**: Fully responsive design with automatic and manual theme switching
- **📱 Mobile Responsive**: Optimized for all screen sizes - phones, tablets, and desktops
- **💾 PWA Support**: Installable on Android, iOS, and Desktop for a native app experience
- **🔌 Offline Capable**: Works offline after the first load (cached data)
- **🔒 Privacy Focused**: Your data stays in your browser (LocalStorage). We do not store your CSV URL or data on any server

## How to Use 🚀

1.  **Export Data**: Open your Ather Ride Log Google Sheet.
2.  **Publish to Web**:
    *   Go to **File > Share > Publish to web**.
    *   Select the **Ride Log** sheet (not "Entire Document").
    *   Select **Comma-separated values (.csv)** as the format.
    *   Click **Publish** and copy the link.
3.  **Connect**: Paste the link into Ather Stats and connect!

## Tech Stack 🛠️

- **Framework**: React (Vite)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (CSS Variables)
- **PWA**: Vite PWA Plugin

## Development 💻

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run dev server: `npm run dev`
4.  Build for production: `npm run build`

## Deployment 🌍

This project is configured for deployment on GitHub Pages.

1.  Push your code to a GitHub repository.
2.  Run: `npm run deploy`
