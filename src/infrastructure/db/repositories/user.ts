import { ICreateUserData } from "../../../application/dtos";
import { IUserRepository } from "../../../application/ports/repositories";
import { IUser, IUserWithPassword } from "../../../domain/entities";
import { db } from "../prisma.client";

export class PrismaUserRepository implements IUserRepository {
  async create(data: ICreateUserData): Promise<IUser> {
    const user = await  db.user.create({data})
    return {id: user.id, email: user.email}
  }
  async findByEmail(email: string): Promise<IUserWithPassword  | null> {
    const user = await db.user.findFirst({where: {email}})
    if(!user) return null
    return {id: user.id, email: user.email, password: user.password} 
  }
  async findById(id: string): Promise<IUser | null> {
    const user = await db.user.findFirst({where: {id}})
    if(!user) return null
    return {id: user.id, email: user.email} 
  }
 async  delete(id: string): Promise<void> {
   await db.user.delete({where: {id}})
  }
  
}