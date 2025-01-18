document.getElementById('register').addEventListener('click', async () => {
    const username = prompt('Enter username for registration:');
    if (!username) return;
  
    // Fetch registration options from the backend
    const response = await fetch(`/webauthn/generate-registration-options?username=${username}`);
    const options = await response.json();
  
    // Start WebAuthn registration
    const publicKey = {
      ...options,
      challenge: Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0)),
      user: {
        ...options.user,
        id: Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0)),
      },
    };
  
    const credential = await navigator.credentials.create({ publicKey });
  
    // Send the response to the backend for verification
    const result = await fetch('/webauthn/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          type: credential.type,
          response: {
            attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          },
        },
      }),
    });
  
    const verification = await result.json();
    alert(verification.verified ? 'Registration successful!' : 'Registration failed.');
  });
  
  function uint8ArrayToBase64Url(uint8Array) {
    return btoa(String.fromCharCode(...uint8Array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  