import { IPost } from "../../domain/entities";

export interface ICreatePostData {
  title: string;
  text: string;
  user_id: string;
}

export interface IUpdatePostData {
  id: string;
  user_id: string;
  title?: string;
  text?: string;
}

export interface IListPostsQuery {
  page: number;
  limit: number;
}

export interface IPaginatedPosts {
  items: IPost[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
