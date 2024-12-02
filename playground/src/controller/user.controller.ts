import { Request, Response } from "express";

export const listUsers = async (req:Request, res: Response) => {
  console.log('---- listUsers')
  res.send('listUsers');
}

export const getUserById = async (req:Request, res: Response) => {
  console.log('---- userById')
  res.send('userById');
}