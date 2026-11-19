import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { hashPassword, checkPassword } from "./password.js";
import { signAccessToken } from "./tokens.js";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function signup(req, res) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    throw new HttpError(409, "Email already used");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Part 3 (Nitesh) replaces this with startSession(res, user)
  res.status(201).json({
    accessToken: signAccessToken(user),
    user: publicUser(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash || !(await checkPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }

  // Part 3 (Nitesh) replaces this with startSession(res, user)
  res.json({
    accessToken: signAccessToken(user),
    user: publicUser(user),
  });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  res.json({ user: publicUser(user) });
}
