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
