async function handleReminders () {
  const expiredReminders = await this.db.getExpiredReminders();
  for (const reminder of expiredReminders) {
    const embed = {
      fields: [{ name: 'You asked to be reminded of:', value: reminder.reminder }],
      footer: { text: 'Reminder originally set on ' },
      timestamp: new Date(reminder.createdDate)
    };

    try {
      if (reminder.channelID) {
        const sent = await this.sendMessage(reminder.channelID, { content: `<@${reminder.ownerID}>`, embed });
        if (!sent) {
          this.sendMessage(reminder.ownerID, { content: `I tried to send this to <#${reminder.channelID}>, but I'm not allowed to speak there.`, embed }, true);
        }
      } else {
        this.sendMessage(reminder.ownerID, { embed }, true);
      }
    } catch (err) {
      this.log(err.stack, 'error');
    } finally {
      const reminders = this.dbConn.collection('reminders');
      if (reminder.recurring) {
        reminders.updateOne({ _id: reminder._id }, {
          '$set': {
            dueDate: Date.now() + reminder.recurring
          }
        });
      } else {
        this.db.deleteReminder(reminder._id);
      }
    }
  }
}


async function onceReady () {
  setInterval(handleReminders.bind(this), this.config.tick || 3000);

}

module.exports = onceReady;