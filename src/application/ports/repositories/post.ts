import { IPost } from "../../../domain/entities";
import { ICreatePostData, IListPostsQuery, IUpdatePostData } from "../../dtos";

export interface IPostRepository {
  create(data: ICreatePostData): Promise<IPost>;
  findById(id: string): Promise<IPost | null>;
  findAll(query: IListPostsQuery): Promise<{ items: IPost[]; total: number }>;
  update(data: IUpdatePostData): Promise<IPost>;
  delete(id: string): Promise<void>;
}
