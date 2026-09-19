import { ICreatePostData, IListPostsQuery, IUpdatePostData } from "../../../application/dtos";
import { IPost } from "../../../domain/entities";
import { IPostRepository } from "../../../application/ports/repositories";
import { prisma } from "../prisma.client";

export class PrismaPostRepository implements IPostRepository {
  create(data: ICreatePostData): Promise<IPost> {
    return prisma().post.create({ data });
  }

  findById(id: string): Promise<IPost | null> {
    return prisma().post.findUnique({ where: { id } });
  }

  async findAll(query: IListPostsQuery): Promise<{ items: IPost[]; total: number }> {
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma().post.findMany({
        take: query.limit,
        skip,
        orderBy: { created_at: "desc" },
      }),
      prisma().post.count(),
    ]);

    return { items, total };
  }

  async update(data: IUpdatePostData): Promise<IPost> {
    const { id, user_id: _userId, ...rest } = data;
    return prisma().post.update({ where: { id }, data: rest });
  }

  async delete(id: string): Promise<void> {
    await prisma().post.delete({ where: { id } });
  }
}
