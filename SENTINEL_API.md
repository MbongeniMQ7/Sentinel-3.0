# Sentinel dashboard API connection

The Manager → Devices page polls the Sentinel dashboard every three seconds and displays the latest reading for each registered device. The employee home dashboard polls the same feed and displays only the reading for that employee's assigned device. The dashboard API key is used only by the Next.js server; it is not included in browser code.

## Configure the app

For local development, copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for this app's existing Supabase authentication.
- `SENTINEL_DASHBOARD_API_URL` to the dashboard read endpoint, for example `https://sentinel-ai-dashboard-tcxf.onrender.com/dashboard`.
- `SENTINEL_DASHBOARD_API_KEY` to the read-only `DASHBOARD_API_KEY` configured on the Render dashboard service.

Set the same `SENTINEL_DASHBOARD_API_URL` and `SENTINEL_DASHBOARD_API_KEY` as server environment variables in the app's hosting provider, then restart or redeploy the app. Do not prefix the dashboard key with `NEXT_PUBLIC_` or commit `.env.local`.

For compatibility with an existing deployment, the server also accepts `DEVICE_DASHBOARD_API_URL` and `DEVICE_DASHBOARD_API_KEY` when the `SENTINEL_` variables are unset.

## Device matching and access

The app's `/api/sentinel/readings` route verifies the signed-in Supabase user and organization. Managers and owners can see registered devices in their organization; employees receive only the reading for their assigned device. The route matches the upstream device ID against the ID registered in Manager → Devices, so register the ESP32 with the exact ID it reports (for example, `3076F5B9F090`).

The dashboard API must have received at least one report for the device. Its in-memory latest-reading store resets when the Render service restarts, so readings will reappear after the device sends another report.
