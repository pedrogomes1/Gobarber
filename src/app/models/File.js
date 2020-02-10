import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    // Esse parâmetro recebe a conexão com o sequelize lá no index.js no model.init
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.APP_URL}/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    return this; // Sempre retorno o model que acabou de ser inicializado
  }
}

export default File;
