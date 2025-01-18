import express from 'express';
import bodyParser from 'body-parser';
import webauthnRoutes from './routes/webauthn';
import path from 'path';
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/webauthn', webauthnRoutes);
app.use(express.static(path.join(__dirname, 'public')));
// Ekspor default
export default app;

// Jalankan server jika file ini adalah entry point
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
