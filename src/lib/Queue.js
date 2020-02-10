import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redis';

const jobs = [CancellationMail];

// Pego todos os jobs e armazeno dentro do queues[]
class Queue {
  constructor() {
    this.queues = [];

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      // Em vez de eu pegar todo, eu desestruturo e pego apenas o key e o handle lá do cancellation
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    // Cancellation 1 parametro, e os dados do appointment no 2
    // Qual fila quero add o trabalho
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED `, err);
  }
}

export default new Queue();
