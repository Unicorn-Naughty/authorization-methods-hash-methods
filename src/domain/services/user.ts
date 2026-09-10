
import { ICreateUserData } from "../../application/dtos";
import { IUserRepository } from "../../application/ports/repositories";

export class UserService {
  constructor(private repo: IUserRepository){}

  async create(d: ICreateUserData){
    return this.repo.create(d)
  }

  async delete(id: string){
    return this.repo.delete(id)
  }

  async findByEmail(email: string){
    return this.repo.findByEmail(email)
  }

  async findById(id: string){
    return this.repo.findById(id)
  }

}