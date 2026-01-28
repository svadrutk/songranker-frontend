# Fixing the Google Auth "Consent Screen" URL

When users log in with Google, they might see a cryptic Supabase URL (e.g., `xyz.supabase.co`) instead of `songranker.app`. To fix this and show your actual domain, follow these steps:

## 1. Configure Supabase Custom Domain (Recommended)

If you have a Pro plan on Supabase, the best way is to set up a custom domain:
1. Go to **Supabase Dashboard** > **Project Settings** > **Custom Domains**.
2. Follow the instructions to link `api.songranker.app` or similar.
3. Once set up, Google will see your domain instead of Supabase's.

## 2. Configure Google Cloud Console (Required)

Even without a Supabase custom domain, you must ensure the Google OAuth client is correctly configured:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. Navigate to **APIs & Services** > **OAuth consent screen**.
4. Ensure the following:
   - **App name**: "Song Ranker"
   - **App domain**: 
     - Home page: `https://songranker.app`
     - Privacy Policy: `https://songranker.app/privacy` (or wherever it is)
     - Terms of Service: `https://songranker.app/terms`
   - **Authorized domains**: Add `songranker.app` and `supabase.co`.
5. **Submit for Verification**: If your app is "External", you must submit it for verification to remove the "unverified app" warning and potentially improve how the URL is displayed.

## 3. Update Supabase Auth Settings

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. **Site URL**: Set to `https://songranker.app`.
3. **Redirect URLs**: Add `https://songranker.app/**`.

## 4. Google Branding (The "Wants Access" part)

Google shows the URL of the *origin* that initiated the request. Since Supabase handles the redirect, it often shows their URL. 

To show `songranker.app` specifically:
1. In Google Cloud Console > **Credentials**.
2. Edit your **OAuth 2.0 Client ID**.
3. Under **Authorized redirect URIs**, you should have your Supabase callback URL (e.g., `https://xyz.supabase.co/auth/v1/callback`).
4. **Note**: You cannot change this redirect URI to your own domain unless you are using the **Custom Domain** feature in Supabase (Step 1). 

### Summary
To get the most professional look ("songranker.app wants access"):
1. **Upgrade Supabase to Pro**.
2. **Enable Custom Domains** in Supabase.
3. **Verify your domain** in Google Search Console and link it to your Google Cloud project.
