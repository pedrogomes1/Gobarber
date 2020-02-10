// Agendamento de todos clientes do prestador de serviço
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    // Verificando se o usuario logado é um prestador de servicos .. provider=treu
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider) {
      return res
        .status(401)
        .json({ error: 'Usuário nao é um prestador de serviços' });
    }

    // Listar agendamentos do dia (passo no query)

    const { date } = req.query;
    const parsedDate = parseISO(date);
    // Pegar da 00:00 até 23:59

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId, // Prestador é o user logado
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      order: ['date'],
    });

    console.log(appointments);

    return res.json(appointments);
  }
}

export default new ScheduleController();
