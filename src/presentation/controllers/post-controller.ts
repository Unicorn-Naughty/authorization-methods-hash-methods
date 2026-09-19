import { IListPostsQuery, IUpdatePostData } from "../../application/dtos";
import { PostService } from "../../domain/services";
import { createHandler } from "../utils/create-handler";

export class PostController {
  constructor(private postService: PostService) {}

  create = createHandler<{ title: string; text: string }>(async (req, res) => {
    const data = await this.postService.create({ ...req.body, user_id: req.user_id! });
    res.status(201).json(data);
  });

  update = createHandler<Pick<IUpdatePostData, "title" | "text">, { id: string }>(
    async (req, res) => {
      const data = await this.postService.update({
        ...req.body,
        user_id: req.user_id!,
        id: req.params.id,
      });
      res.status(200).json(data);
    },
  );

  findOne = createHandler<unknown, { id: string }>(async (req, res) => {
    const data = await this.postService.findOne(req.params.id);
    res.status(200).json(data);
  });

  findAll = createHandler<unknown, unknown, IListPostsQuery>(async (req, res) => {
    const data = await this.postService.findAll(req.query);
    res.status(200).json(data);
  });

  delete = createHandler<unknown, { id: string }>(async (req, res) => {
    await this.postService.delete(req.params.id, req.user_id!);
    res.status(204).send();
  });
}
