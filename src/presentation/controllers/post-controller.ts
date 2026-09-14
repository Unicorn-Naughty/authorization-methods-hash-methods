import { PostService } from "../../domain/services";
import { createHandler } from "../utils/create-handler";

export class PostController {
  constructor(private postService: PostService) {}

  create = createHandler<{ title: string; text: string }>(async (req, res) => {
    const data = await this.postService.create({ ...req.body, userId: req.userId! });
    res.status(201).json(data);
  });

  update = createHandler<{ title: string; text: string }>(async (req, res) => {
    const data = await this.postService.update({
      ...req.body,
      userId: req.userId!,
      id: req.params.id,
    });
    res.status(200).json(data);
  });

  findOne = createHandler(async (req, res) => {
    const data = await this.postService.findOne(req.params.id);
    res.status(200).json(data);
  });

  findAll = createHandler(async (_req, res) => {
    const data = await this.postService.findAll();
    res.status(200).json(data);
  });

  delete = createHandler(async (req, res) => {
    await this.postService.delete(req.params.id, req.userId!);
    res.status(204).send();
  });
}
