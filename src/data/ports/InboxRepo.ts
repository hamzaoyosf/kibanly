import { Repo } from './Repo'
import { InboxItem } from './schemas'

export interface InboxRepo extends Repo<InboxItem> {
  // Inbox-specific helper methods can be extended here if needed
}
