import { Request, Response } from "express";
import { userGenerator } from "../db/user.entity";

const insertUser = userGenerator();
insertUser.next();

export const signIn = async (req:Request, res: Response) => {
  console.log('---- signIn')
  console.log(req.body)
  const userId = insertUser.next({
    email: "1",
    password: "123",
    name: "234",
  }).value;

  res.send(`Sign In Complete for the user: ${userId}`);
}

export const signOut = async (req:Request, res: Response) => {
  console.log('---- signOut')
  res.send('signOut');
}