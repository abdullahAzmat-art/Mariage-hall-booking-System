const Message = require('../models/messageModel');
const User = require('../models/userModel');

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const { venuoraGraph } = await import('../Venuora-AI/graph/venuoraGraph.js');
    const initialState = { question: message };
    const finalState = await venuoraGraph.invoke(initialState);
    res.json({ reply: finalState.answer });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
};

// Streaming SSE endpoint
const chatStreamWithAI = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // FIX 1: Only write if connection is still open
  const send = (event, data) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  // FIX 2: Safe token streamer — stops if client disconnects mid-stream
  const safeStreamText = async (text) => {
    const CHUNK_SIZE = 3;
    const DELAY_MS = 18;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      if (res.writableEnded) return;
      send('token', { text: text.slice(i, i + CHUNK_SIZE) });
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  };

  // FIX 3: Catch ECONNRESET at socket level so nodemon never crashes
  req.socket.on('error', (err) => {
    if (err.code === 'ECONNRESET') {
      console.warn("Client disconnected (ECONNRESET) - safe to ignore.");
    }
  });

  try {
    const { message, threadId } = req.body;
    const { venuoraGraph } = await import('../Venuora-AI/graph/venuoraGraph.js');
    const { Command } = await import('@langchain/langgraph');

    const activeThreadId = threadId || crypto.randomUUID();
    const config = { configurable: { thread_id: activeThreadId } };

    send('thread', { threadId: activeThreadId });

    const currentState = await venuoraGraph.getState(config);
    const isInterrupted = Array.isArray(currentState?.next) && currentState.next.length > 0;

    const streamInput = isInterrupted
      ? new Command({ resume: message })
      : { question: message };

    const stream = await venuoraGraph.stream(streamInput, {
      ...config,
      streamMode: "updates",
    });

    let finalAnswer        = null;
    let hallsPayload       = null;
    let bookingFormPayload = null;

    for await (const chunk of stream) {

      // Interrupt fired (graph paused, waiting for user reply)
      if (chunk.__interrupt__) {
        const interruptMsg = chunk.__interrupt__[0]?.value ?? "Would you like to proceed?";

        if (hallsPayload) {
          send('halls', hallsPayload);
          if (finalAnswer) await safeStreamText(finalAnswer);
        }

        await safeStreamText(interruptMsg);

        send('done', { threadId: activeThreadId, awaitingReply: true });
        if (!res.writableEnded) res.end();
        return;
      }

      const nodeOutput = Object.values(chunk)[0];
      if (nodeOutput?.answer !== undefined)            finalAnswer        = nodeOutput.answer;
      if (nodeOutput?.viewHallsOutput !== undefined)   hallsPayload       = nodeOutput.viewHallsOutput;
      if (nodeOutput?.bookingFormOutput !== undefined) bookingFormPayload = nodeOutput.bookingFormOutput;
    }

    if (!finalAnswer && !hallsPayload && !bookingFormPayload) {
      send('done', { threadId: activeThreadId });
      if (!res.writableEnded) res.end();
      return;
    }

    if (bookingFormPayload) {
      send('booking_form', bookingFormPayload);
      if (finalAnswer) await safeStreamText(finalAnswer);
    } else if (hallsPayload) {
      send('halls', hallsPayload);
      if (finalAnswer) await safeStreamText(finalAnswer);
    } else if (finalAnswer) {
      await safeStreamText(finalAnswer);
    }

    send('done', { threadId: activeThreadId, awaitingReply: false });
    if (!res.writableEnded) res.end();

  } catch (error) {
    // ECONNRESET = user closed browser tab mid-stream, NOT a real crash
    if (error.code === 'ECONNRESET' || error.code === 'ERR_HTTP_HEADERS_SENT') {
      console.warn("Client disconnected early - safe to ignore.");
      return;
    }
    console.error("Stream Chat Error:", error);
    send('error', { message: "Sorry, something went wrong. Please try again." });
    if (!res.writableEnded) res.end();
  }
};

const getMessages = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).sort({ timestamp: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const partnerId = msg.fromUserId.toString() === userId ? msg.toUserId.toString() : msg.fromUserId.toString();
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          lastMessage: msg.message,
          time: msg.timestamp,
        });
      }
    }

    const conversations = [];
    for (const [partnerId, data] of conversationsMap.entries()) {
      const partner = await User.findById(partnerId).select('name role');
      if (partner) {
        conversations.push({
          id: partnerId,
          name: partner.name,
          lastMessage: data.lastMessage,
          time: new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: `https://ui-avatars.com/api/?name=${partner.name}&background=random`
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Error fetching conversations" });
  }
};

module.exports = { chatWithAI, chatStreamWithAI, getMessages, getConversations };
