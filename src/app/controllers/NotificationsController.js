import Notification from '../models/schemas/Notifications';

import User from '../models/User';

class NotificationsController {
  async index(req, res) {
    // Essa rota só pode ser acessível por prestadores de serviço

    const checkIsProvider = await User.findOne({
      where: {
        id: req.userId, // Se o usuário logado é um prestador de serviço
        provider: true,
      },
    });

    if (!checkIsProvider) {
      return res
        .status(401)
        .json({ error: 'Usuário logado é um prestador de serviço' });
    }

    const notification = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' }) // Ordenar por data
      .limit(20);

    return res.json(notification);
  }

  async update(req, res) {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true } // Serve para trazer o registro que foi atualizado de volta
    );
    return res.json(notification);
  }
}

export default new NotificationsController();
