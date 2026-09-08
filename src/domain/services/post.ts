import { ICreatePostData, IUpdatePostData } from "../../application/dtos";
import { IPostRepository } from "../../application/ports/repositories";

export class PostService {
  constructor(private repo: IPostRepository){}

  async create(data: ICreatePostData) {
    return this.repo.create(data)
  }

  async update(data: IUpdatePostData) {
    return this.repo.update(data)
  }

  async findOne(id: string) {
    return this.repo.findById(id)
  }

  async findAll(){
    return this.repo.findAll()
  }

  async delete(id: string){
    return this.repo.delete(id)
  }
}