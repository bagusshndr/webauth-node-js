export interface User {
  id: string;
  username: string;
  currentChallenge: string;
  credentials: Array<{
    credentialID: string;
    publicKey: string;
    counter: number;
  }>;
}
