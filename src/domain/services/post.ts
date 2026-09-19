import { ICreatePostData, IListPostsQuery, IUpdatePostData } from "../../application/dtos";
import { IPostRepository } from "../../application/ports/repositories";
import { AppError } from "../errors";

export class PostService {
  constructor(private repo: IPostRepository) {}

  async create(data: ICreatePostData) {
    return this.repo.create(data);
  }

  async update(data: IUpdatePostData) {
    if (data.title === undefined && data.text === undefined) {
      throw new AppError("nothing to update", 400);
    }

    const post = await this.repo.findById(data.id);

    if (!post) throw new AppError("Post not found", 404);

    if (post.user_id !== data.user_id) throw new AppError("Forbidden", 403);

    return this.repo.update(data);
  }

  async findOne(id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new AppError("Post not found", 404);
    return post;
  }

  async findAll(query: IListPostsQuery) {
    const { items, total } = await this.repo.findAll(query);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, user_id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new AppError("Post not found", 404);

    if (post.user_id !== user_id) throw new AppError("Forbidden", 403);

    return this.repo.delete(id);
  }
}
