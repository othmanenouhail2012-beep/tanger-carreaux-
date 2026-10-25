import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const app = createApp();
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(dist, { maxAge: '1d', index: false }));
app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`MediaFlow listening on http://localhost:${port}`));
