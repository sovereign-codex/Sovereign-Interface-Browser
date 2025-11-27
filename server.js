import express from 'express';
import path from 'path';
const app = express();
app.use(express.static('dist'));
app.get('*', (_, res) => res.sendFile(path.resolve('dist/index.html')));
app.listen(5173, () => console.log("SIB fallback server running on 5173"));
