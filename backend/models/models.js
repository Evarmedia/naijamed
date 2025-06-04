const { User, Patients, Doctors  } = require("./userModel");
const { Message } = require("./messagesModel")

// User - Patients relationship
Patients.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User - Doctors relationship
Doctors.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User - Message relationship
Message.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});


module.exports = {
  User,
  Patients,
  Doctors,
  Message,
};
