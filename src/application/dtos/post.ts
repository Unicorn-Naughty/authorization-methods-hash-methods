export interface ICreatePostData {
  title: string;
  text: string;
  user_id: string;
}

export interface IUpdatePostData {
  id: string;
  user_id: string;
  title: string;
  text: string;
}
