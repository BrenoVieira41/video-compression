import multer from 'multer';
import express, { Router, Request, Response } from 'express';
import compressing from 'compressing';
import fs, { renameSync } from 'fs';
import zlib from 'zlib';
import { CompilationType } from './model';

const uploads = multer({ dest: 'uploads' });
const app = express();
const router = Router();

app.use(express.json());

router.post('/api/video/compilation/:type', uploads.single('video'), async (req: Request, res: Response) => {
  try {
    const video = req.file;
    const newName = req.body.name;
    const newfileName = `${video.path}.mp4`;

    renameSync(video.path, newfileName);
    const { type } = req.params;

    if (type === CompilationType.STREAM || type === 'stream') {
      const completVideo = `uploads/complet/${newName}.mp4.rar`;
      const readStream = fs.createReadStream(newfileName);
      const writeStream = fs.createWriteStream(completVideo);
      const gzip = zlib.createGzip();

      readStream.pipe(gzip).pipe(writeStream);
      writeStream.on('finish', () => {
        return res.send('Arquivo zipado com sucesso');
      });

      writeStream.on('error', error => {
        console.error(error);
        throw new Error(error.message);
      })
    }

    if (type === CompilationType.CB || type === 'cb') {
      const completVideo = `uploads/complet/${newName}.rar`;
      return compressing.zip.compressFile(newfileName, completVideo).then(() =>
        res.send('Arquivo zipado com sucesso')
      ).catch((error) => {throw new Error(error)});
    }

  } catch (error) {
    console.error(error);
    return res.status(400).send('Error: Falha ao compilar video.');
  }
});

app.use(router);

export { app };
