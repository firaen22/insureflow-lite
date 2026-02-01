<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Insureflow CRM

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

### Build

To build the project for production:

```bash
npm run build
```

## Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setup

1. Go to your repository **Settings**.
2. Navigate to **Pages** (under Code and automation).
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. The deployment workflow will run automatically on every push to the `main` branch.

## File Structure

- `src`: Application source code
- `dist`: Production build output
- `.github/workflows`: CI/CD configurations

## Google Sheets Integration

To enable the "Personal Database" feature, you need to configure a Google Cloud Project.

### 1. Google Cloud Setup
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Navigate to **APIs & Services > Library** and enable **Google Sheets API**.
4.  Navigate to **APIs & Services > OAuth consent screen**:
    *   User Type: **External**
    *   Test Users: Add your email (and colleagues' emails).
5.  Navigate to **APIs & Services > Credentials**:
    *   Create **OAuth 2.0 Client ID**.
    *   Application type: **Web application**.
    *   Authorized JavaScript origins:
        *   `http://localhost:3000`
        *   `https://<YOUR_GITHUB_USERNAME>.github.io`
6.  Copy the **Client ID** and **API Key** (create one if needed under Credentials).

### 2. Configure GitHub Secrets
1.  Go to your GitHub Repository **Settings > Secrets and variables > Actions**.
2.  Add the following secrets:
    *   `VITE_GOOGLE_CLIENT_ID`: (Your OAuth Client ID)
    *   `VITE_GOOGLE_API_KEY`: (Your API Key)

### 3. Usage
1.  Open the app and click the **Database** icon (bottom right).
2.  Click **Sign in with Google**.
3.  Paste your **Spreadsheet ID** (from the URL of your Google Sheet) into the input box.
    *   *Example URL*: `docs.google.com/spreadsheets/d/1BxiMVs.../edit` -> ID is `1BxiMVs...`
4.  Click **Sync Data**.
