// Conexão com o BD e carregar os models
// É necessário chamar esse arquivo de database no app.js
import Sequelize from 'sequelize';

import mongoose from 'mongoose';
import databaseConfig from '../config/database';
import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  // Faz a conexão com o BD e carrega os models
  init() {
    this.connection = new Sequelize(databaseConfig); // Crio a conexão e passo via parâmetro as configurações do config > database.js
    // Essa variável this.connection é a variavel esperada lá dentro do models > User dentro do init

    models
      .map(model => model.init(this.connection)) // Esse model.init é do model de User do super.init .. passo essa conexão lá pra ele
      .map(model => model.associate && model.associate(this.connection.models));
  }

  mongo() {
    this.mongoConnection = mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();
