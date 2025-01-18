document.getElementById('authenticate').addEventListener('click', async () => {
    const username = prompt('Enter username for authentication:');
    if (!username) return;
  
    // Fetch authentication options from the backend
    const response = await fetch(`https://5674-2001-448a-2020-a9ef-6914-d2b5-ad4b-b0b5.ngrok-free.app/webauthn/generate-authentication-options?username=${username}`);
    const options = await response.json();
  
    // Start WebAuthn authentication
    const publicKey = {
      ...options,
      challenge: Uint8Array.from(
        atob(base64urlToBase64(options.challenge)),
        (c) => c.charCodeAt(0)
      ),
      allowCredentials: options.allowCredentials.map((cred) => ({
        ...cred,
        id: Uint8Array.from(
          atob(base64urlToBase64(cred.id)),
          (c) => c.charCodeAt(0)
        ),
      })),
    };
  
    const credential = await navigator.credentials.get({ publicKey });
  
    // Send the response to the backend for verification
    const result = await fetch('https://5674-2001-448a-2020-a9ef-6914-d2b5-ad4b-b0b5.ngrok-free.app/webauthn/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          type: credential.type,
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
            userHandle: credential.response.userHandle
              ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle)))
              : null,
          },
        },
      }),
    });
  
    const verification = await result.json();
    alert(verification.verified ? 'Authentication successful!' : 'Authentication failed.');
  });


  function base64urlToBase64(base64url) {
    return base64url.replace(/-/g, '+').replace(/_/g, '/');
  }
  
  