// Configuração de uploads de arquivo
import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';
// Ext name é a extensao do arquivo, resolve percorre o caminho

export default {
  // Armazena as imagens dentro do temp > uploads
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);

        // se n deu erro
        return cb(null, res.toString('hex') + extname(file.originalname)); // To transformando 16bytes de string aleatoria em hexadecimal
      });
    },
  }),
};
