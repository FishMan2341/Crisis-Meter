export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Missing code parameter');
    return;
  }

  const clientId = 'Ov23liH02WRAfllQYxnh';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientSecret) {
    res.status(500).send('GITHUB_CLIENT_SECRET environment variable is not set');
    return;
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const data = await response.json();

    if (data.error) {
      res.status(401).send(`
        <html><body><script>
          (function() {
            window.opener.postMessage(
              'authorization:github:error:${JSON.stringify({ message: data.error_description || data.error })}',
              document.referrer || '*'
            );
            window.close();
          })();
        </script></body></html>
      `);
      return;
    }

    const token = data.access_token;
    const provider = 'github';

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html><body><script>
        (function() {
          function receiveMessage(e) {
            console.log("receiveMessage %o", e);
            window.opener.postMessage(
              'authorization:${provider}:success:{"token":"${token}","provider":"${provider}"}',
              e.origin
            );
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:${provider}", "*");
        })();
      </script></body></html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
}
