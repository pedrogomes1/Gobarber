import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['id', 'name', 'email', 'avatar_id'], // Trago somente esses campos no filtro
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ], // Recupero os atributos lá no model
    });

    return res.json(providers);
  }
}

export default new ProviderController();
