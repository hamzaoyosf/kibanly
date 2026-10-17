import { Repo } from './Repo'
import { TimeBlock } from './schemas'

export interface TimeBlockRepo extends Repo<TimeBlock> {
  // Can be extended with range queries for date boundaries
}
