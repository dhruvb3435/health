import 'reflect-metadata';
// Load env first so DataSource can read DATABASE_* variables
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: __dirname + '/../../.env' });
} catch (e) {
  // ignore
}

import { AppDataSource } from './typeorm.config';

export default AppDataSource;
