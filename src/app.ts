import * as bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "../build/routes";
import * as swaggerUi from "swagger-ui-express";
import { ApiError } from "./apiError";
const swaggerDocument = require("../swagger.json");

class App {
  public app: express.Application;

  constructor() {
    this.app = express();

    this.initializeMiddlewares();
    this.initializeControllers();
    this.initializeErrorHandling();
    this.initializeSwagger();
  }

  public listen() {
    const port = process.env.PORT ?? 8080;
    this.app.listen(port, () => {
      console.log(`App listening on the port ${port}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    this.app.use(bodyParser.json());
  }

  private initializeErrorHandling() {
    this.app.use(function errorHandler(
      err: unknown,
      req: Request,
      res: Response,
      next: NextFunction
    ): Response | void {
      if (err instanceof ValidateError) {
        console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
        return res.status(422).json({
          message: "Validation Failed",
          details: err?.fields,
        });
      }
      if (err instanceof ApiError) {
        console.log(`Api error ${req.path}: ${err}`);
        return res.status(err.statusCode).json({
          message: err.message,
          errorCode: err.name,
        });
      }

      if (err instanceof Error) {
        console.log(`Internal error ${req.path}: ${err}`);
        return res.status(500).json({
          message: "Internal Server Error",
        });
      }

      next();
    });
  }

  private initializeControllers() {
    RegisterRoutes(this.app);
  }

  private initializeSwagger() {
    this.app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }
}

export default App;
