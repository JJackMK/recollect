const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log(hashedPassword);
}

// Replace 'yourPlainTextPassword' with the actual plain-text password
hashPassword("password1");
