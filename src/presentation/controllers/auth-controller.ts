import type { ILoginData, IRegisterData } from "../../application/dtos";
import { AuthService } from "../../domain/services";
import { createHandler } from "../utils/create-handler";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = createHandler<IRegisterData>(async (req, res) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  });

  login = createHandler<ILoginData>(async (req,res)=>{
    const result = await this.authService.login(req.body)
     res.json(result);
  })

  refresh = createHandler<{refreshToken: string}>(async (req,res)=>{
    const result = await this.authService.refresh(req.body.refreshToken)
     res.status(200).json(result);
  })

  logout = createHandler<{refreshToken: string}>(async (req,res)=>{
    await this.authService.logout(req.body.refreshToken)
    res.status(204).send();
  })

}