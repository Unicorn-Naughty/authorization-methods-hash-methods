import { ICreatePostData, IUpdatePostData } from "../../application/dtos";
import { IPostRepository } from "../../application/ports/repositories";
import { AppError } from "../../shared";


export class PostService {
  constructor(private repo: IPostRepository){}

  async create(data: ICreatePostData) {

    return this.repo.create(data)
  }

  async update(data: IUpdatePostData) {
    const post = await this.repo.findById(data.id)

    if (!post) throw new AppError("Post not found", 404);

    if(post?.userId !== data.userId) throw new AppError("Forbidden", 403)

    return this.repo.update(data)
  }

  async findOne(id: string) {
    return this.repo.findById(id)
  }

  async findAll(){
    return this.repo.findAll()
  }

  async delete(id: string, userId: string){
        const post = await this.repo.findById(id)
        if (!post) throw new AppError("Post not found", 404);


    if(post?.userId !== userId) throw new AppError("Forbidden", 403)

    return this.repo.delete(id)
  }
}