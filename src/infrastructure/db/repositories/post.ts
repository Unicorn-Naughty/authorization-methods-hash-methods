import { ICreatePostData, IUpdatePostData } from "../../../application/dtos";
import { IPostRepository } from "../../../application/ports/repositories";
import { IPost } from "../../../domain/entities";
import { db } from "../prisma.client";

export class PrismaPostRepository implements IPostRepository {
  create(data: ICreatePostData): Promise<IPost> {
    return db.post.create({ data });
  }
  findById(id: string): Promise<IPost | null> {
    return db.post.findFirst({ where: { id } });
  }
  findAll(): Promise<IPost[]> {
    return db.post.findMany();
  }
  async update(data: IUpdatePostData): Promise<IPost> {
    const { id, ...rest } = data;
    return db.post.update({ where: { id }, data: rest });
  }
  async delete(id: string): Promise<void> {
    await db.post.delete({ where: { id } });
  }
}
