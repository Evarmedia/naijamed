const { User, Patients, Doctors  } = require("./userModel");

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

module.exports = {
  User,
  Patients,
  Doctors,
};
