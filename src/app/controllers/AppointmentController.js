import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../models/schemas/Notifications';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20, // Qnts registros eu quero pular
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // eslint-disable-next-line camelcase
    const { provider_id, date } = req.body;

    // Verifcar se o provider é de fato um provider e nao é um user comum

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date)); // startofHour pega o inicio da hora, nao pega min e seg

    if (isBefore(hourStart, new Date())) {
      // Verifico se o hourStart esta antes do newDate(data atual)
      return res.status(401).send({ error: 'Data não valida' });
    }

    // Verificar se o prestador ja tem um agendamento marcado p mesmo horario

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    // O horario n esta vago
    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Agendamento dessa data nao está disponivel' });
    }

    if (!(req.userId !== isProvider.id)) {
      return res.json({
        error: 'Prestador de serviço não pode agendar para si próprio',
      });
    }
    const newAppointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart, // Não cria horario com minutos e segundos
    });

    // Notificar agendamento ao prestador de serviço
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'", // dia 02 de junho as 8hrs`
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    console.log(newAppointment);

    return res.json(newAppointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      // Verifica se o usuario logado é diferente do usuario passado por parametro
      // Se ele não é o dono ele nao pode cancelar o agendamento
      return res.status(401).json({
        error: 'Usuário não tem permissão para cancelar esse agendamento',
      });
    }
    const dateWithSub = subHours(appointment.date, 2);

    // 13:00
    // 11:00 <- dateWithSub
    // Horario atual for 11:25, não pode cancelar, pois tem que ser 2 hrs antes .. por isso tem q fazer verificação

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'Passou do horario para cancelar - Limite são 2 hrs' });
    }

    appointment.canceled_at = new Date(); // Seto o horario atual no canceled

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
