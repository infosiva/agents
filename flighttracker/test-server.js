const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.static('public'));

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running at http://localhost:${PORT}`);
});