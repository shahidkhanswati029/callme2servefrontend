# Fix Facebook login on Vercel / Railway

Error like:  
`…vercel.app can't continue using facebook.com. This option is unavailable right now`

This is a **Meta App domain allowlist** issue, not a broken login button.

## 1. Use a stable Production URL

Do **not** rely on preview URLs like:

`callme2servefrontend-447q5vacx-….vercel.app`

Use your Vercel **Production** domain, e.g.:

`https://callme2servefrontend.vercel.app`

(or your custom domain)

## 2. Meta Developer Console

1. https://developers.facebook.com → your app (`FACEBOOK_APP_ID`)
2. **Settings → Basic**
   - **App Domains:** `callme2servefrontend.vercel.app` (host only)
   - **Add Platform → Website**
   - **Site URL:** `https://callme2servefrontend.vercel.app/`
3. **Products → Facebook Login → Settings**
   - **Valid OAuth Redirect URIs:**
     - `https://callme2servefrontend.vercel.app/`
     - `https://callme2servefrontend.vercel.app/login`
     - `https://callme2servefrontend.vercel.app/register`
4. **App Mode:** **Live**  
   Or keep Development and add your Facebook user under **Roles → Testers**
5. Save changes (can take a few minutes)

## 3. Vercel env (frontend)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | same as Meta App ID |
| `NEXT_PUBLIC_API_URL` | your live backend URL |
| `NEXT_PUBLIC_SITE_URL` | `https://callme2servefrontend.vercel.app` |

Redeploy frontend after changing `NEXT_PUBLIC_*`.

## 4. Backend env

| Name | Value |
|------|--------|
| `FACEBOOK_APP_ID` | same App ID |
| `FACEBOOK_APP_SECRET` | App Secret |
| `CORS_ORIGIN` | include your frontend Production URL |

Redeploy backend.

## 5. Test

Open Production URL → `/login` and `/register` → Continue with Facebook.
