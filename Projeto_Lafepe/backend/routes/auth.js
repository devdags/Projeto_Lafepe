const express = require('express');
const router = express.Router();

const predefinedUser = {
  username: 'admin',
  password: 'admin'
};

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  
  if (usuario === predefinedUser.username && senha === predefinedUser.password) {
    req.session.loggedin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Usuário ou senha incorretos.' });
  }
});

module.exports = router;
