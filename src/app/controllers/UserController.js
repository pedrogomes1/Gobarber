import * as Yup from 'yup'; // Validaçõess
import User from '../models/User';

class UserController {
  async store(req, res) {
    // Validações
    const schema = Yup.object().shape({
      // Estou validando um objeto(req.body) .. e passo o formato
      name: Yup.string().required(),
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

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    const { name, email, id, provider } = await User.create(req.body);

    return res.json({
      name,
      email,
      id,
      provider,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      // Estou validando um objeto(req.body) .. e passo o formato
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6), // Se o usuario passar a senha antiga, obviamente que a nova tem q ser required
      password: Yup.string()
        .min(6) // O Field se refere ao próprio password
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      // Confirmação de senha
      confirmPassword: Yup.string().when(
        'password',
        (
          password,
          field // Quando o password estiver preenchido 'password' , eu recbo o password e o field (password, field)
        ) => (password ? field.required().oneOf([Yup.ref('password')]) : field) // Se o password estiver preenchido -> password ? o campo confirm password vai ser obrigatorio .. field.required() e ele precisa ser igual o password ... oneOf e ele pode ter um unico tipo de valor [ref]
      ),
    });
    // Se retornar false
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    // Caso o usuário queira mudar o email
    if (email && email !== user.email) {
      // Só vai atualizar o email se o usuario preencheu o email na edição do front
      // Se o email do body for != do email do banco

      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    // Verifica a senha antiga se bate c a atual
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      // Só vou fazer essa verificação se a senha bate, se ele passou a senha antiga (oldPassoword antes do && )
      return res.json({ error: 'Password not match' });
    }

    const { name, id, provider } = await user.update(req.body);

    return res.json({
      name,
      email,
      id,
      provider,
    });
  }
}

export default new UserController();
