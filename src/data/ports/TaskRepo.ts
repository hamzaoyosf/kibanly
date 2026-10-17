import { Repo } from './Repo'
import { Task } from './schemas'

export interface TaskRepo extends Repo<Task> {
  // Task-specific helper methods can be extended here if needed
}
