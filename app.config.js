// app.config.js
module.exports = {
  expo: {
    name: "Gita App",
    slug: "gita-app",
    // When using Expo proxy you don't strictly need a custom scheme,
    // but it’s good to have one for prod:
    extra: {
      APP_SCHEME: "gitaapp", // or whatever scheme you set
      WIX_CLIENT_ID: "4c67c641-ee47-4200-8df6-255dd7612152", // a real GUID
      WIX_AUTH_AUTH_URL: "https://www.wixapis.com/oauth2/authorize",
      WIX_AUTH_TOKEN_URL: "https://www.wixapis.com/oauth2/token",
      // optional if you have it
      WIX_AUTH_USERINFO_URL: "https://www.wixapis.com/oauth2/userinfo",
    },
scheme: "gitaapp", // must match APP_SCHEME,
  },
};