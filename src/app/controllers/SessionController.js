import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      // Estou validando um objeto(req.body) .. e passo o formato
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });
    // Se retornar false
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).send({ error: 'Usuário não cadastrado' });
    }

    if (!(await user.checkPassword(password))) {
      // Quero verficiar se a senha não bate, por isso tem q negar ...
      return res.status(401).send({ error: 'Does not match' });
    }

    const { id, name } = user; // É o que eu quero retornar

    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }), // Primeiro parâmetro é o payload (que são info adicionais que quero incorporar dentro do token) .. passo o id para poder ter acesso a essa info dps que for reutilizar o token na aplicação .. o Segundo parametro é uma string que seja unico em todas aplicações(MD5 online para gerar)
    });
  }
}

export default new SessionController();
