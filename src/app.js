import 'dotenv/config';

import express from 'express';
import path from 'path';
import * as Sentry from '@sentry/node';
import Youch from 'youch';
import 'express-async-errors'; // Tem que importar antes das rotas
import routes from './routes';
import sentryConfig from './config/sentry';

import './database';

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      // O express entende que quando passo um middleware com 4 parâmetros, é um middleware de tratamento de exceções
      if (process.env.NODE_ENV === 'development') {
        const error = await new Youch(err, req).toJSON();

        return res.status(500).json(error);
      }

      return res.status(500).json({ error: 'Internal server error' });
    });
  }
}

export default new App().server;
