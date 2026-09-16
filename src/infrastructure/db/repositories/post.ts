import { PrismaClient } from "@prisma/client";
import { ICreatePostData, IUpdatePostData } from "../../../application/dtos";
import { IPostRepository } from "../../../application/ports/repositories";
import { IPost } from "../../../domain/entities";

export class PrismaPostRepository implements IPostRepository {
  constructor(private db: PrismaClient) {}

  create(data: ICreatePostData): Promise<IPost> {
    return this.db.post.create({ data });
  }
  findById(id: string): Promise<IPost | null> {
    return this.db.post.findFirst({ where: { id } });
  }
  findAll(): Promise<IPost[]> {
    return this.db.post.findMany();
  }
  async update(data: IUpdatePostData): Promise<IPost> {
    const { id, ...rest } = data;
    return this.db.post.update({ where: { id }, data: rest });
  }
  async delete(id: string): Promise<void> {
    await this.db.post.delete({ where: { id } });
  }
}
