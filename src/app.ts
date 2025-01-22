import express from 'express';
import bodyParser from 'body-parser';
import webauthnRoutes from './routes/webauthn';
import path from 'path';
import cors from 'cors';
const app = express();
const PORT = 3000;


const allowedOrigins = [
  'https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app',
];

const corsOptions = {
  origin: (origin: string, callback : any) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions as cors.CorsOptions));
app.use(bodyParser.json());

// Rute WebAuthn
app.use('/webauthn', webauthnRoutes);

app.use(express.static(path.join(__dirname, 'public')));

export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
