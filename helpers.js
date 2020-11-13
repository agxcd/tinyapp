//Helper Functions

const idRandom = () => {
  return Math.random().toString(36).substring(7);
};



const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user
    }
  }
};

module.exports = {
  idRandom,
  getUserByEmail
};
