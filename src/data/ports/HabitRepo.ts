import { Habit, HabitLog } from './schemas'
import { Repo } from './Repo'

export type HabitRepo = Repo<Habit>
export type HabitLogRepo = Repo<HabitLog>
