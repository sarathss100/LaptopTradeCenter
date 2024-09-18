import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  const token = req.cookies.accessToken; // Assuming 'jwt' is the cookie name

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store decoded user info in `req.user`
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
