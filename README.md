<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-4rmyDRq1JK3X8yeXkUvJyhxm4lx3Jdm

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a local env file (DO NOT commit this file):

   - Copy the example and fill your real key locally:

     ```powershell
     copy .env.example .env.local
     # then edit .env.local and set the API_KEY value
     ```

   - The app expects the API key in `API_KEY` (server-side) or `VITE_GEMINI_API_KEY` for local Vite-only testing.

   - Important: `.env.local` is ignored by `.gitignore`. Never commit secrets into the repo.

3. Run the app locally:
   `npm run dev`

4. CI / Deploy: add your secret to the hosting provider (GitHub Actions, Vercel, Netlify).
   - Example: GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret → name `API_KEY`.
   - The included `.github/workflows/build.yml` shows an example of injecting the `API_KEY` secret into the build.
