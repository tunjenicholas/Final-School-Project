const bcrypt = require('bcrypt');

// Define the password you want to hash
const password = 'admin';

// Define the number of salt rounds (10 is commonly used)
const saltRounds = 10;

// Hash the password
bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hashedPassword);
  }
});
