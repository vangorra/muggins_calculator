import { calculateWorkerFunctions } from './solver';
import { expose } from './worker-utils';

expose(calculateWorkerFunctions);
