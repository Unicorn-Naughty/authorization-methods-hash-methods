import { IUnitOfWork } from "../../application/ports/transaction";
import { runInTransaction } from "./prisma.client";

export class PrismaUnitOfWork implements IUnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T> {
    return runInTransaction(fn);
  }
}
