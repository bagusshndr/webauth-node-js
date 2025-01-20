import express from 'express';
import bodyParser from 'body-parser';
// import cors from 'cors';
import webauthnRoutes from './routes/webauthn';
import path from 'path';

const app = express();
const PORT = 3000;


// const allowedOrigins = [
//   'http://localhost:3001',
//   'http://example.com',
//   'https://another-frontend.com',
// ];

// // Konfigurasi CORS untuk multiple origins
// const corsOptions = {
//   origin: (origin: string, callback : any) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST'], // Batasi metode yang diizinkan
//   credentials: true, // Izinkan pengiriman cookie lintas domain
// };

// app.use(cors(corsOptions as cors.CorsOptions));

// Middleware Body Parser
app.use(bodyParser.json());

// Rute WebAuthn
app.use('/webauthn', webauthnRoutes);

// Middleware untuk file statis
app.use(express.static(path.join(__dirname, 'public')));

export default app;

// Jalankan server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
