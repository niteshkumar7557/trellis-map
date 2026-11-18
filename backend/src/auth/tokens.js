import jwt from "jsonwebtoken";

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);
