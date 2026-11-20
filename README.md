# Gaming Mouse Final Project

## Run

```powershell
node server.js
```

Open `http://localhost:3000`. Share the same URL on the local network after replacing `localhost` with this computer's local IP address.

The A/B form randomly assigns A or B once per browser session and stores valid responses in `responses.json`. Do not report an effect until each group has at least 30 responses.

## Deploy on Render

1. Sign in at [Render](https://render.com/) with GitHub.
2. Select **New +** then **Blueprint**.
3. Choose the `hyeok9865/20261120` repository and approve the detected `render.yaml`.
4. Deploy. Render will provide a public `https://...onrender.com` URL to share with respondents.

The free Render plan uses temporary local storage. Download the response CSV from `/api/responses.csv` regularly, especially before redeploying or after long inactivity. For long-term collection, use a persistent database before publishing results.

## Data scope

18 gaming mice; public manufacturer specifications and official US MSRP; collected 2026-11-20. Prices are USD and represent list price, not Korean retail prices or transaction prices.
