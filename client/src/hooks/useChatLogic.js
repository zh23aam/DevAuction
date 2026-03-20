import { useMemo } from "react";

/**
 * Shared hook to process raw chat messages into a grouped, displayable format.
 * Groups messages by date and maintains chronological order.
 */
const useChatLogic = (msgs) => {
  const processedMessages = useMemo(() => {
    if (!msgs || (!msgs.myMessages && !msgs.senderMessages)) return [];

    const myMsgs = msgs.myMessages || [];
    const senderMsgs = msgs.senderMessages || [];

    // Tag and combine all messages
    const allMessages = [
      ...myMsgs.map(m => ({ ...m, type: "to" })),
      ...senderMsgs.map(m => ({ ...m, type: "from" }))
    ].sort((a, b) => a.at - b.at);

    const items = [];
    let lastDate = null;

    allMessages.forEach((message) => {
      const date = new Date(message.at);
      const localDate = date.toLocaleDateString();
      const localTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add a date header if the date has changed
      if (localDate !== lastDate) {
        items.push({
          isDateHeader: true,
          label: localDate,
          id: `date-${message.at}`
        });
        lastDate = localDate;
      }

      items.push({
        ...message,
        localTime,
        id: `${message.type}-${message.at}`
      });
    });

    return items;
  }, [msgs]);

  return processedMessages;
};

export default useChatLogic;
