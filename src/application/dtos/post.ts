export interface ICreatePostData {
  title: string;
  text: string;
  userId: string;
}

export interface IUpdatePostData {
  id: string;
  userId: string;
  title: string;
  text: string;
}
