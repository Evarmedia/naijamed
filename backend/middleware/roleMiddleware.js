const { User, Role } = require('../models/models'); // Import your models

// Role-based access control middleware
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Assuming user info is stored in req.user from previous authentication middleware
      // console.log(req.user);
      const user = await User.findByPk(req.user.user_id, {
        include: {
          model: Role,
          attributes: ['role_name'],
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the user's role matches any of the allowed roles
      if (!allowedRoles.includes(user.Role.role_name)) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
      }

      // If role matches, proceed to the next middleware
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { checkRole };