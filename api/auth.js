// api/auth.js — Vercel serverless function
// Handles GitHub OAuth for Decap CMS
// Based on: https://github.com/decaporg/decap-cms/blob/main/website/src/pages/docs/github-backend.md

export default function handler(req, res) {
  const { host } = req.headers;
  const { code, provider } = req.query;

  if (!code) {
    // Step 1: Redirect to GitHub OAuth
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('scope', 'repo,user');
    githubAuthUrl.searchParams.set('redirect_uri', `https://${host}/api/auth`);
    return res.redirect(githubAuthUrl.toString());
  }

  // Step 2: Exchange code for access token
  fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
    .then(r => r.json())
    .then(data => {
      const token = data.access_token;
      const script = `
        <script>
          (function() {
            function receiveMessage(e) {
              console.log("receiveMessage %o", e);
            }
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token, provider: 'github' }).replace(/'/g, "\\'")}',
              '*'
            );
          })()
        </script>
      `;
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html><html><body>${script}</body></html>`);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
}
