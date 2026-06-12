// Role-based access control middleware
// Uses role from JWT payload (set by authMiddleware)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userRole = req.user.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Forbidden: You do not have access to this resource",
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = { checkRole };