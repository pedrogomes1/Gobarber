import jwt from 'jsonwebtoken';
import { promisify } from 'util'; // Transforma uma função de callback em uma função async await .. como o método verify ainda é antigo, ele suporta os callback, e por isso transformo em async await

import authConfig from '../../config/auth'; // Preciso importar ele pq lá tem o segredo do token p tentar descriptografar aqui e ver se está valido

// Verificar se o usuário está logado
export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ error: 'Token not provided ' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};
