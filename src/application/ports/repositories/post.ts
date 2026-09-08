import { IPost } from "../../../domain/entities";
import { ICreatePostData, IUpdatePostData } from "../../dtos";

export interface IPostRepository {
  create(data: ICreatePostData): Promise<IPost>;

  findById(id: string): Promise<IPost | null>;

  findAll(): Promise<IPost[]>;

  update(data: IUpdatePostData): Promise<IPost>;

  delete(id: string): Promise<void>;
}