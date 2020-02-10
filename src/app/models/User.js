import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    // Esse parâmetro recebe a conexão com o sequelize lá no index.js no model.init
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
    this.addHook('beforeSave', async user => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this; // Sempre retorno o model que acabou de ser inicializado
  }

  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' }); // Estou associando o id do arquivo na tabela do usuario
  }

  // Comparo a senha que o usuário ta tentando logar com a senha que o usuario tem(this.password_hash senha criptografada)
  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
