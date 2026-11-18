import bcrypt from "bcrypt";

const ROUNDS = 10; // each extra round doubles the work; 10 is the common default

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);
