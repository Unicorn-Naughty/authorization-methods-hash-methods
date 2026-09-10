import bcrypt from "bcrypt";
import { IHashService } from "../../application/ports/services";

export class BcryptHashService implements IHashService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
